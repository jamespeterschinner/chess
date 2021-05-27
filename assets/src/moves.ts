
import { AssignedPiece, Board, Coordinates, coordinatesToIndex, EmptySquare, indexToCoordinates, MaybeEmptySquare, NonEmptySquare, Piece, Player, Square } from './board'
import { Maybe, isJust, nothing, just, filter, defaultMapUnwrap, map, unwrap } from './maybe'


interface PredicateArgs {
    square: NonEmptySquare,
    board: Board
    relMove: Coordinates
}



function stepTowards(from: number, to: number): number {
    if (from < to) {
        return from + 1
    } else if (from > to) {
        return from - 1
    } else {
        return from
    }
}
const bounds = (n: number) => (n >= 0 && n <= 7)

function moveTowards(from: Coordinates, to: Coordinates): Coordinates {
    return {
        file: stepTowards(from.file, to.file),
        row: stepTowards(from.row, to.row)
    }
}

type Path = Coordinates[]

function generatePath(origin: Coordinates, offset: Coordinates): Maybe<Coordinates[]> {
    let previousSquare = origin
    let destination = { file: origin.file + offset.file, row: origin.row + offset.row }
    let path: Coordinates[] = []
    while (previousSquare.file != destination.file || previousSquare.row != destination.row) {
        previousSquare = moveTowards(previousSquare, destination)
        if (!bounds(previousSquare.file) || !bounds(previousSquare.row)) {
            return nothing
        }
        path.push(previousSquare)
    }
    return just(path)
}

function getSquareFromCoordinates({ file, row }: Coordinates, board: Board): Maybe<MaybeEmptySquare> {

    if (bounds(file) && bounds(row)) {
        return just(board[coordinatesToIndex({ file, row })])
    } else {
        return nothing
    }
}

function getSquareFromRelativeCoordinates({ square, board, relMove }: PredicateArgs): Maybe<MaybeEmptySquare> {
    return getSquareFromCoordinates(addCoordinates(square.coordinates, relMove), board)
}

function getPieceFromRelativeCoordinates(args: PredicateArgs): Maybe<AssignedPiece> {
    return defaultMapUnwrap(
        getSquareFromRelativeCoordinates(args),
        square => square.piece,
        nothing
    )
}

function squareOccupied(coordinates: Coordinates, board: Board): boolean {
    return defaultMapUnwrap(
        getSquareFromCoordinates(coordinates, board),
        square => isJust(square.piece),
        false
    )
}

function pathClear({ square, board, relMove }: PredicateArgs): boolean {
    let notBlocked = (coordinates: Coordinates) => !squareOccupied(coordinates, board)
    return defaultMapUnwrap(generatePath(square.coordinates, relMove), path => path.every(notBlocked), false)
}

function notOccupiedByOwnPiece(args: PredicateArgs): boolean {
    return defaultMapUnwrap(
        getSquareFromRelativeCoordinates(args),
        square => defaultMapUnwrap(square.piece, piece => piece.owner != args.square.piece.owner, true),
        false
    )
}

function pathClearAndTakeable(args: PredicateArgs) {
    return pathClear({ ...args, relMove: moveTowards(args.relMove, { file: 0, row: 0 }) })
    // && !notOccupiedByOwnPiece(args)
}

function firstMove({ square }: PredicateArgs): boolean {
    return square.piece.moveCount == 0 ? true : false
}

function toNonEmptySquare(maybeEmptySquare: MaybeEmptySquare): Maybe<NonEmptySquare> {
    return defaultMapUnwrap(
        maybeEmptySquare.piece,
        assignedPiece => { return just({ ...maybeEmptySquare, piece: assignedPiece }) },
        nothing
    )
}

function addCoordinates(coordinates: Coordinates, offset: Coordinates): Coordinates {
    return { file: coordinates.file + offset.file, row: coordinates.row + offset.row }
}

function oppositeColourPiece({ square, board, relMove: move }: PredicateArgs): boolean {
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove: move })
    return defaultMapUnwrap(maybePiece, piece => piece.owner != square.piece.owner, false)

}

function enPassentPredicate({ square, board, relMove: move }: PredicateArgs): boolean {
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove: { ...move, row: 0 } })
    return defaultMapUnwrap(maybePiece,
        piece => {
            // piece here is the piece being taken
            return piece.owner != square.piece.owner &&
                piece.moveCount == 1 &&
                square.piece.enPassent &&
                piece.enPassent &&
                (square.coordinates.row == 3 || square.coordinates.row == 4)
        }
        , false)
}

type PredicateFunc = (args: PredicateArgs) => boolean



type Index = number

export type StateChange = {
    overwrite: { index: Index, piece: AssignedPiece }
    remove: Index[]
    possiblyEnPassentable: Index[]
}

export type PossibleMove = [Coordinates, StateChange]

export type MappedMoves = {
    [key: string]: StateChange
}

type ChangeArgs = {
    piece: AssignedPiece, previousCoordinates: Coordinates, newCoordinates: Coordinates
}

type CreateChange = (args: ChangeArgs) => StateChange

function invertCoordinates(coordinates: Coordinates) {
    return { file: coordinates.file * -1, row: coordinates.row * -1 }
}

type PredicateMoves = (args: PredicateArgs) => Maybe<PossibleMove>[]

const predicatedMove = (relMove: Coordinates, change: CreateChange, predicates: PredicateFunc[]) =>
    (args: Omit<PredicateArgs, 'relMove'>): Maybe<PossibleMove> => {

        // Allows all moves to be defined in the perspective of white
        let orientatedMove = (args.square.piece.owner == Player.Black) ?
            invertCoordinates(relMove) : relMove
        let predicateArgs = { ...args, relMove: orientatedMove } as PredicateArgs
        let absoluteMove = addCoordinates(args.square.coordinates, orientatedMove)
        return predicates.every(func => func(predicateArgs)) ?
            just([absoluteMove,
                change({
                    piece: args.square.piece,
                    previousCoordinates: args.square.coordinates,
                    newCoordinates: absoluteMove
                })])
            : nothing
    }

function defaultChange({ piece, previousCoordinates, newCoordinates }: ChangeArgs): StateChange {
    return {
        overwrite: { piece: piece, index: coordinatesToIndex(newCoordinates) },
        remove: [coordinatesToIndex(previousCoordinates)],
        possiblyEnPassentable: []
    }
}

function enableEnPassentChange(args: ChangeArgs): StateChange {
    // When a pawn moves two squares next to the other players pawn
    let def = defaultChange(args)
    return {
        ...def,
        // Set en passent to true on the moved pawn
        overwrite: { ...def.overwrite, piece: { ...def.overwrite.piece, enPassent: true } },
        // Also set en passent to true on the neighboring pieces if they exist
        possiblyEnPassentable: [1, -1].map(
            offset => coordinatesToIndex({ ...args.newCoordinates, file: args.newCoordinates.file + offset })
        )
    }
}

function enPassentChange(args: ChangeArgs): StateChange {
    // The actual en passent move, taking behing the piece
    let change = defaultChange(args)
    return {
        ...change, remove: [
            ...change.remove,
            coordinatesToIndex({ ...args.newCoordinates, row: args.previousCoordinates.row })
        ]
    }
}
const pawnMoves = [
    // single square forward
    predicatedMove({ file: 0, row: 1 }, defaultChange, [pathClear]),
    // Two squares on first move 
    predicatedMove({ file: 0, row: 2 }, enableEnPassentChange, [pathClear, firstMove]),
    // Take diagonal Left / Right
    predicatedMove({ file: 1, row: 1 }, defaultChange, [oppositeColourPiece]),
    predicatedMove({ file: -1, row: 1 }, defaultChange, [oppositeColourPiece]),
    // En passent
    predicatedMove({ file: 1, row: 1 }, enPassentChange, [enPassentPredicate]),
    predicatedMove({ file: -1, row: 1 }, enPassentChange, [enPassentPredicate]),

]

const knightMoves = [[2, 1], [-2, 1], [2, -1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]
    .map(function ([file, row]) { return predicatedMove({ file, row }, defaultChange, [notOccupiedByOwnPiece]) });

const kingMoves = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]]
    .map(function ([file, row]) { return predicatedMove({ file, row }, defaultChange, [notOccupiedByOwnPiece]) });

function generateMovesInDirection(direction: Coordinates, { board, square }: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    type T = Maybe<PossibleMove>
    function* moveGenerator(): Generator<T, any, T> {
        let offset = direction
        while (true) {
            yield predicatedMove(offset, defaultChange, [notOccupiedByOwnPiece, pathClearAndTakeable])({ board, square })
            offset = addCoordinates(offset, direction)
        }
    }
    let moves: PossibleMove[] = [], moveGen = moveGenerator(), currentMove: Maybe<PossibleMove> = moveGen.next().value
    while (isJust(currentMove)) {
        map(currentMove, move => moves.push(move))
        currentMove = moveGen.next().value
    }
    return moves

}

function generateOrthogonalMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    return [
        generateMovesInDirection({ file: 0, row: 1 }, args),
        generateMovesInDirection({ file: 0, row: -1 }, args),
        generateMovesInDirection({ file: 1, row: 0 }, args),
        generateMovesInDirection({ file: -1, row: 0 }, args)

    ].flat()
}

function generateDiagonalMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    return [
        generateMovesInDirection({ file: 1, row: 1 }, args),
        generateMovesInDirection({ file: -1, row: -1 }, args),
        generateMovesInDirection({ file: 1, row: -1 }, args),
        generateMovesInDirection({ file: -1, row: 1 }, args)

    ].flat()
}

export function possibleMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    switch (args.square.piece.piece) {
        case Piece.Pawn: return filter(pawnMoves.map(func => func(args)))
        case Piece.Knight: return filter(knightMoves.map(func => func(args)))
        case Piece.King: return filter(kingMoves.map(func => func(args)))
        case Piece.Bishop: return generateDiagonalMoves(args)
        case Piece.Rook: return generateOrthogonalMoves(args)
        case Piece.Queen: return [generateDiagonalMoves(args), generateOrthogonalMoves(args)].flat()
        default: return []
    }

}


function listOpponentsMoves({ square: moveSquare, board }: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    return board.filter(square => defaultMapUnwrap(square.piece, piece => piece.owner != moveSquare.piece.owner, false))
        .map(toNonEmptySquare)
        .filter(isJust)
        .map(unwrap)
        .map(square => possibleMoves({ square, board }))
        .flat()
}

function getKingsCoordinates(board: Board, player: Player): Maybe<Coordinates> {
    for (let square of board) {
        let coordinates = defaultMapUnwrap(square.piece, piece => {
            return (piece.piece == Piece.King && piece.owner == player) ?
                just(square.coordinates)
                : nothing
        }, nothing)
        if (isJust(coordinates)) {
            return coordinates
        }
    }
    return nothing
}



function filterMovesThatThreatenKing(args: Omit<PredicateArgs, 'relMove'>, [coordinates, StateChange]: PossibleMove): boolean {
    console.log('considerd move', coordinates)
    // Generate a list of index's that the opposite player could move to (on then next turn) if the current move
    // in consideration is played
    let boardStateAfterMove = applyChange(args.board, StateChange)
    let opponentMoveIndexes = listOpponentsMoves({ ...args, board: boardStateAfterMove })
        .map(function ([coordinates]) { return coordinatesToIndex(coordinates) })
    // If the players king is could be taken, then this current move is not allowed
    let maybeKingsIndex = map(getKingsCoordinates(boardStateAfterMove, args.square.piece.owner), coordinatesToIndex)
    return defaultMapUnwrap(maybeKingsIndex, kingsIndex => opponentMoveIndexes.every(index => index != kingsIndex), false)
}

export function possibleMovesThatDontThreatenKing(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    return possibleMoves(args).filter(possibleMove => filterMovesThatThreatenKing(args, possibleMove))
}

let enableEnPassent = (square: MaybeEmptySquare): MaybeEmptySquare => {
    return {
        ...square, piece: map(square.piece, assignedPiece => {
            return assignedPiece.piece == Piece.Pawn ?
                { ...assignedPiece, enPassent: true }
                : assignedPiece
        })
    }
}

let disableEnPassent = (square: MaybeEmptySquare): MaybeEmptySquare => {
    return {
        ...square, piece: map(square.piece, assignedPiece => {
            return { ...assignedPiece, enPassent: false }
        })
    }
}

export function applyChange(board: Board, { overwrite: { index, piece }, remove, possiblyEnPassentable }: StateChange): Board {
    return board.map((square: MaybeEmptySquare, idx: Index): MaybeEmptySquare => {
        if (idx == index) {
            return { ...square, piece: just({ ...piece, moveCount: piece.moveCount + 1 }) }
        } else if (remove.some(rm => rm == idx)) {
            return { ...square, piece: nothing }
        } else if (possiblyEnPassentable.some(en => en == idx)) {
            return enableEnPassent(square)
        } else {
            return disableEnPassent(square)
        }
    })
}


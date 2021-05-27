import {
    coordinatesToIndex, getSquareFromCoordinates, generatePath,
    getSquareFromRelativeCoordinates, getPieceFromRelativeCoordinates, moveTowards,
    addCoordinates,
    getPieceFromCoordinates,
    bounds
} from './helpers'
import { Maybe, isJust, nothing, just, filter, defaultMapUnwrap, map, unwrap, Just } from './maybe'
import {
    MaybeEmptySquare, NonEmptySquare, Piece, Player, AssignedPiece,
    Board, Coordinates, PredicateArgs, RookType, Index,
    CreateChange, PredicateFunc, PossibleMove, ChangeArgs, StateChange
} from './types'


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

function oppositeColourPiece({ square, board, relMove }: PredicateArgs): boolean {
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove })
    return defaultMapUnwrap(maybePiece, piece => piece.owner != square.piece.owner, false)

}


function getRookCoordinates(rookType: RookType, player: Player): Coordinates {
    // Not the current rook coordinates, but the initial coordinates
    return {
        [RookType.Queens]: { [Player.White]: { file: 0, row: 0 }, [Player.Black]: { file: 7, row: 7 } }[player],
        [RookType.Kings]: { [Player.White]: { file: 7, row: 0 }, [Player.Black]: { file: 0, row: 7 } }[player]
    }[rookType]
}
const rookNotMoved = (rookType: RookType) => ({ square, board, relMove }: PredicateArgs): boolean => {

    return defaultMapUnwrap(
        getSquareFromCoordinates(getRookCoordinates(rookType, square.piece.owner), board),
        square => defaultMapUnwrap(square.piece, piece => piece.moveCount == 0, false), false)
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


function invertCoordinates(coordinates: Coordinates) {
    return { file: coordinates.file * -1, row: coordinates.row * -1 }
}

// type PredicateMoves = (args: PredicateArgs) => Maybe<PossibleMove>[]

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
                    board: args.board,
                    piece: args.square.piece,
                    previousCoordinates: args.square.coordinates,
                    newCoordinates: absoluteMove
                })])
            : nothing
    }

function defaultChange({ piece, previousCoordinates, newCoordinates }: ChangeArgs): StateChange {
    return {
        overwrite: [{ piece: piece, index: coordinatesToIndex(newCoordinates) }],
        remove: [coordinatesToIndex(previousCoordinates)],
        possiblyEnPassentable: []
    }
}

function enableEnPassentChange({ piece, previousCoordinates, newCoordinates }: ChangeArgs): StateChange {
    // When a pawn moves two squares next to the other players pawn
    return {
        // Set en passent to true on the moved pawn
        overwrite: [{ index: coordinatesToIndex(newCoordinates), piece: { ...piece, enPassent: true } }],
        // Also set en passent to true on the neighboring pieces if they exist
        possiblyEnPassentable: [1, -1].map(
            offset => coordinatesToIndex({ ...newCoordinates, file: newCoordinates.file + offset })
        ),
        remove: []
    }
}

function enPassentChange(args: ChangeArgs): StateChange {
    // The actual en passent move, pawn taking opponents pawn behind it
    let change = defaultChange(args)
    return {
        ...change, remove: [
            ...change.remove,
            coordinatesToIndex({ ...args.newCoordinates, row: args.previousCoordinates.row })
        ]
    }
}

function kingSideCastleChange(args: ChangeArgs): StateChange {
    let change = defaultChange(args)
    let newRookIndex = coordinatesToIndex(addCoordinates(args.newCoordinates, { file: 1, row: 0 }))
    let oldRookCoordinates = getRookCoordinates(RookType.Kings, args.piece.owner)

    // This move is predicated on the rook being in its initial position. So overriding the type
    // **SHOULD** be safe
    let rookPiece = unwrap(getPieceFromCoordinates(oldRookCoordinates, args.board) as Just<AssignedPiece>)

    return {
        ...change,
        overwrite: [...change.overwrite, { index: newRookIndex, piece: rookPiece }],
        remove: [coordinatesToIndex(oldRookCoordinates)]
    }
}

function queenSideCastleChange(args: ChangeArgs): StateChange {
    return defaultChange(args)

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

// These seemimgly magic numbers are the possible moves in [file, row] relative to the current
// pieces position
const knightMoves = [[2, 1], [-2, 1], [2, -1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]
    .map(function ([file, row]) { return predicatedMove({ file, row }, defaultChange, [notOccupiedByOwnPiece]) });


const singleKingMOves = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]]
    .map(function ([file, row]) { return predicatedMove({ file, row }, defaultChange, [notOccupiedByOwnPiece]) });

const castleMoves = [
    // Castle king side
    predicatedMove({ file: 2, row: 0 }, kingSideCastleChange, [pathClear, firstMove, rookNotMoved(RookType.Kings)]),
    predicatedMove({ file: -2, row: 0 }, queenSideCastleChange, [pathClear, firstMove, rookNotMoved(RookType.Queens)])
]

const kingMoves = [singleKingMOves, castleMoves].flat()

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

export function applyChange(board: Board, { overwrite, remove, possiblyEnPassentable }: StateChange): Board {
    return board.map((square: MaybeEmptySquare, idx: Index): MaybeEmptySquare => {
        for (let { index, piece } of overwrite) {
            if (index == idx) {
                return {
                    ...square, piece: just({ ...piece, moveCount: piece.moveCount + 1 })
                }
            }
        }

        if (remove.some(rm => rm == idx)) {
            return { ...square, piece: nothing }
        } else if (possiblyEnPassentable.some(en => en == idx)) {
            return enableEnPassent(square)
        } else {
            return disableEnPassent(square)
        }
    })
}


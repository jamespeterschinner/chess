import { AssignedPiece, Board, Coordinates, coordinatesToIndex, MaybeEmptySquare, NonEmptySquare, Piece, Player } from './board'
import { Maybe, isJust, nothing, just, filter, defaultMapUnwrap } from './maybe'


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

function generatePath(origin: Coordinates, offset: Coordinates): Coordinates[] {
    let previousSquare = origin
    let destination = { file: origin.file + offset.file, row: origin.row + offset.row }
    let path: Coordinates[] = []
    while (previousSquare.file != destination.file || previousSquare.row != destination.row) {
        previousSquare = {
            file: stepTowards(previousSquare.file, destination.file),
            row: stepTowards(previousSquare.row, destination.row)
        }
        path.push(previousSquare)
    }
    return path
}

function getSquareFromCoordinates(coordinates: Coordinates, board: Board): Maybe<MaybeEmptySquare> {
    let index = coordinatesToIndex(coordinates)
    return index in board ? just(board[index]) : nothing
}

function getPieceFromRelativeCoordinates({ square, board, relMove }: PredicateArgs): Maybe<AssignedPiece> {
    return defaultMapUnwrap(
        getSquareFromCoordinates(addCoordinates(square.coordinates, relMove), board),
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

function pathClear({ square, board, relMove: move }: PredicateArgs): boolean {
    let notBlocked = (coordinates: Coordinates) => !squareOccupied(coordinates, board)
    console.log(generatePath(square.coordinates, move))
    return generatePath(square.coordinates, move).every(notBlocked)
}

function firstMove({ square }: PredicateArgs): boolean {
    return square.piece.moveCount == 0 ? true : false
}

function addCoordinates(coordinates: Coordinates, offset: Coordinates): Coordinates {
    return { file: coordinates.file + offset.file, row: coordinates.row + offset.row }
}

function oppositeColourPiece({ square, board, relMove: move }: PredicateArgs): boolean {
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove: move })
    return defaultMapUnwrap(maybePiece, piece => piece.owner != square.piece.owner, false)

}

function enPassent({ square, board, relMove: move }: PredicateArgs): boolean {
    console.log(move)
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove: { ...move, row: 0 } })
    return defaultMapUnwrap(maybePiece,
        piece => {
            return piece.owner != square.piece.owner &&
                piece.piece == Piece.Pawn &&
                piece.moveCount == 1 &&
                (square.coordinates.row == 3 || square.coordinates.row == 4)
        }
        , false)
}

type PredicateFunc = (args: PredicateArgs) => boolean

type Index = number

export type StateChange = {
    overwrite: { index: Index, piece: AssignedPiece }
    remove: Index[]
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
        remove: [coordinatesToIndex(previousCoordinates)]
    }
}

function enPassentChange(args: ChangeArgs): StateChange {
    let change = defaultChange(args)
    return {
        ...change, remove: [
            ...change.remove,
            coordinatesToIndex({ ...args.newCoordinates, row: args.previousCoordinates.row})
        ]
    }
}
const pawnMoves = [
    // single square forward
    predicatedMove({ file: 0, row: 1 }, defaultChange, [pathClear]),
    // Two squares on first move 
    predicatedMove({ file: 0, row: 2 }, defaultChange, [pathClear, firstMove]),
    // Take diagonal Left / Right
    predicatedMove({ file: 1, row: 1 }, defaultChange, [oppositeColourPiece]),
    predicatedMove({ file: -1, row: 1 }, defaultChange, [oppositeColourPiece]),
    // En passent
    predicatedMove({ file: 1, row: 1 }, enPassentChange, [enPassent]),
    predicatedMove({ file: -1, row: 1 }, enPassentChange, [enPassent]),

]

export function possibleMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    switch (args.square.piece.piece) {
        case Piece.Pawn: { return filter(pawnMoves.map(func => func(args))) }
        default: return []
    }

}

export function applyChange(board: Board, { overwrite: { index, piece }, remove }: StateChange): Board {
    return board.map((square: MaybeEmptySquare, idx: Index): MaybeEmptySquare => {
        if (idx == index) {
            return { ...square, piece: just({ ...piece, moveCount: piece.moveCount + 1 }) }
        } else if (remove.some(rm => rm == idx)) {
            return { ...square, piece: nothing }
        } else {
            return square
        }
    })
}
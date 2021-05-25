import { Board, Coordinates, coordinatesToIndex, MaybeEmptySquare, NonEmptySquare, Piece, Player } from './board'
import { Maybe, isJust, nothing, just, filter } from './maybe'


interface PredicateArgs {
    square: NonEmptySquare,
    board: Board
    move: Coordinates
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

function getSquareFromCoordinates(coordinates: Coordinates, board: Board): MaybeEmptySquare {
    return board[coordinatesToIndex(coordinates)]
}

function squareOccupied(coordinates: Coordinates, board: Board): boolean {
    return isJust(getSquareFromCoordinates(coordinates, board).piece)
}

function pathClear({ square, board, move }: PredicateArgs): boolean {
    let notBlocked = (coordinates: Coordinates) => !squareOccupied(coordinates, board)
    console.log(generatePath(square.coordinates, move))
    return generatePath(square.coordinates, move).every(notBlocked)
}

function firstMove({ square }: PredicateArgs): boolean {
    return square.piece.moveCount == 0 ? true : false
}

type PredicateFunc = (args: PredicateArgs) => boolean

function invertCoordinates(coordinates: Coordinates) {
    return { file: coordinates.file * -1, row: coordinates.row * -1 }
}

function addCoordinates(coordinates: Coordinates, offset: Coordinates): Coordinates {
    return { file: coordinates.file + offset.file, row: coordinates.row + offset.row }
}

const predicatedMove = (move: Coordinates, predicates: PredicateFunc[]) =>
    (args: Omit<PredicateArgs, 'move'>): Maybe<Coordinates> => {

        // Allows all moves to be defined in the perspective of white
        let orientatedMove = (args.square.piece.owner == Player.Black) ?
            invertCoordinates(move) : move

        return (predicates.every(func => func({ ...args, move: orientatedMove } as PredicateArgs))) ?
            just(addCoordinates(args.square.coordinates, orientatedMove))
            : nothing
    }

const pawnMoves = [
    // single square forward
    predicatedMove({ file: 0, row: 1 }, [pathClear]),
    // Two squares on first move 
    predicatedMove({ file: 0, row: 2 }, [pathClear, firstMove])
]

export function possibleMoves(args: Omit<PredicateArgs, 'move'>): Coordinates[] {
    switch (args.square.piece.piece) {
        case Piece.Pawn: { return filter(pawnMoves.map(func => func(args))) }
        default: return []
    }

}
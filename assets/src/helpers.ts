import {
    Maybe, just, nothing, defaultMapUnwrap,
    Nothing, map, isJust, unwrap, Just
} from './maybe'
import {
    Board, AssignedPiece, Square, Coordinates,
    Index, NonEmptySquare, MaybeEmptySquare, PredicateArgs, PromotableTo
} from './types'

enum Player {
    White,
    Black,
}

enum Piece {
    King,
    Queen,
    Bishop,
    Knight,
    Rook,
    Pawn,
}


function generatePieceURI(player: string, piece: string) {
    return `/pieces/${[player, piece].join('-') + '.svg'}`
}

const namedValues = (object: Object): string[] => Object.values(object).filter(item => typeof item == 'string')

const pieceSVGUri = Object.fromEntries(
    namedValues(Player).map(player => namedValues(Piece).map(piece => [`${player}${piece}`, generatePieceURI(player, piece)])).flat()
)

export function createAssignedPiece(owner: Player, piece: Piece): AssignedPiece {
    return {
        owner,
        piece,
        enPassent: false,
        moveCount: 0,
        svgURI: pieceSVGUri[`${Player[owner]}${Piece[piece]}`]
    }
}

export const emptyBoard: Square<Nothing>[] = Array(64).fill(null).map(
    (value, index) => { return { index, coordinates: indexToCoordinates(index), piece: nothing } }
)


export function coordinatesToIndex({ file, row }: Coordinates): Index {
    return file * 8 + row
}

export function indexToCoordinates(index: number): Coordinates {
    return {
        file: Math.floor(index / 8),
        row: index % 8,
    }
}

export function invertOrientation(coordinates: Coordinates) {
    // Used to invert black moves
    return { file: coordinates.file, row: coordinates.row * -1 }
}

export const rowToAssignedPlayer = (row: number): Maybe<Player> => {
    if (row <= 1) {
        return just(Player.White)
    } else if (row >= 6) {
        return just(Player.Black)
    } else {
        return nothing
    }
}

export function coordinatesToInitialPiece({ file, row }: Coordinates, player: Player) {
    let addPiece = (piece: Piece) => createAssignedPiece(player, piece)
    // Assign pawns
    switch (row) {
        case 0:
        case 7:
            // Add pieces
            switch (file) {
                case 0:
                    return addPiece(Piece.Rook)
                case 1:
                    return addPiece(Piece.Knight)
                case 2:
                    return addPiece(Piece.Bishop)
                case 3:
                    return addPiece(Piece.King)
                case 4:
                    return addPiece(Piece.Queen)
                case 5:
                    return addPiece(Piece.Bishop)
                case 6:
                    return addPiece(Piece.Knight)
                case 7:
                    return addPiece(Piece.Rook)
            }
        default: return addPiece(Piece.Pawn)
    }
}


export const initialBoard = emptyBoard.map(
    (square: Square<Nothing>): Square<Maybe<AssignedPiece>> => {
        return {
            ...square, piece:
                map(rowToAssignedPlayer(square.coordinates.row),
                    (player: Player) => { return coordinatesToInitialPiece(square.coordinates, player) })
        }
    }
)

export function getSquaresWithPieces(board: Board): NonEmptySquare[] {
    return (board
        .filter((square: Square<Maybe<AssignedPiece>>) => isJust(square.piece)) as Square<Just<AssignedPiece>>[])
        .map((square: Square<Just<AssignedPiece>>) => {
            return { ...square, piece: unwrap(square.piece) }
        })
}

export function relXYToCoordinates(scale: number, offsetCoordinates: Coordinates, x: number, y: number): Coordinates {
    let { file, row } = offsetCoordinates;
    return {
        file: Math.round(x / scale) + file,
        row: Math.round(y / scale) + row,
    }

}

export function addCoordinates(coordinates: Coordinates, offset: Coordinates): Coordinates {
    return { file: coordinates.file + offset.file, row: coordinates.row + offset.row }
}

export function stepTowards(from: number, to: number): number {
    if (from < to) {
        return from + 1
    } else if (from > to) {
        return from - 1
    } else {
        return from
    }
}
export const bounds = (n: number) => (n >= 0 && n <= 7)

export function moveTowards(from: Coordinates, to: Coordinates): Coordinates {
    return {
        file: stepTowards(from.file, to.file),
        row: stepTowards(from.row, to.row)
    }
}

export function generatePath(origin: Coordinates, offset: Coordinates): Maybe<Coordinates[]> {
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

export function getSquareFromCoordinates({ file, row }: Coordinates, board: Board): Maybe<MaybeEmptySquare> {

    if (bounds(file) && bounds(row)) {
        return just(board[coordinatesToIndex({ file, row })])
    } else {
        return nothing
    }
}

export function getPieceFromCoordinates(coordinates: Coordinates, board: Board): Maybe<AssignedPiece> {
    return defaultMapUnwrap(
        getSquareFromCoordinates(coordinates, board),
        square => square.piece,
        nothing
    )

}

export function getSquareFromRelativeCoordinates({ square, board, relMove }: PredicateArgs): Maybe<MaybeEmptySquare> {
    return getSquareFromCoordinates(addCoordinates(square.coordinates, relMove), board)
}

export function getPieceFromRelativeCoordinates(args: PredicateArgs): Maybe<AssignedPiece> {
    return defaultMapUnwrap(
        getSquareFromRelativeCoordinates(args),
        square => square.piece,
        nothing
    )
}


export function toNonEmptySquare(maybeEmptySquare: MaybeEmptySquare): Maybe<NonEmptySquare> {
    return defaultMapUnwrap(
        maybeEmptySquare.piece,
        assignedPiece => { return just({ ...maybeEmptySquare, piece: assignedPiece }) },
        nothing
    )
}

export function getRookCoordinates(relFile: number, player: Player): Coordinates {
    // Not the current rook coordinates, but the initial coordinates
    return (relFile > 0) ?
        { [Player.White]: { file: 7, row: 0 }, [Player.Black]: { file: 7, row: 7 } }[player]
        : { [Player.White]: { file: 0, row: 0 }, [Player.Black]: { file: 0, row: 7 } }[player]
}

export function getKingsCoordinates(board: Board, player: Player): Maybe<Coordinates> {
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

export function enableEnPassent(square: MaybeEmptySquare): MaybeEmptySquare {
    return {
        ...square, piece: map(square.piece, assignedPiece => {
            return assignedPiece.piece == Piece.Pawn ?
                { ...assignedPiece, enPassent: true }
                : assignedPiece
        })
    }
}

export function disableEnPassent(square: MaybeEmptySquare): MaybeEmptySquare {
    return {
        ...square, piece: map(square.piece, assignedPiece => {
            return { ...assignedPiece, enPassent: false }
        })
    }
}

export function getPromotablePieces(player: Player): AssignedPiece[] {
    return [Piece.Queen, Piece.Rook, Piece.Bishop, Piece.Knight].map(
        piece => createAssignedPiece(player, piece)
    )

}
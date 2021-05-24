import { Board, Coordinates, AssignedPiece, coordinatesToIndex, indexToCoordinates, MaybeEmptySquare, Piece, Player, NonEmptySquare } from "./board";
import { just, map, nothing } from "./maybe"


export function relXYToCoordinates(scale: number, offsetCoordinates: Coordinates, x: number, y: number): Coordinates {
    let { file, row } = offsetCoordinates;
    return {
        file: Math.round(x / scale) + file,
        row: Math.round(y / scale) + row,
    }

}

export function movePiece(board: Board, movedSquare: NonEmptySquare, droppedIndex: number): Board {
    return board.map((square: MaybeEmptySquare, index: number): MaybeEmptySquare => {
        // Each actions precedence is import. Overwrite, remove, maintain
        if (square.index == droppedIndex) {
            // Overwrite previous piece
            return { ...square, piece: just(movedSquare.piece) }
        } else if (movedSquare.index == square.index) {
            // remove moved piece
            return { ...square, piece: nothing }
        } else {
            return square
        }
    })
}

function getSquareFromCoordinates(board: Board, coordinates: Coordinates): MaybeEmptySquare {
    return board[coordinatesToIndex(coordinates)]
}

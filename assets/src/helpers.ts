import { Board, Coordinates, MaybeEmptySquare, NonEmptySquare } from "./board";
import { just, nothing } from "./maybe"


export function relXYToCoordinates(scale: number, offsetCoordinates: Coordinates, x: number, y: number): Coordinates {
    let { file, row } = offsetCoordinates;
    return {
        file: Math.round(x / scale) + file,
        row: Math.round(y / scale) + row,
    }

}


export function movePiece(board: Board, movedSquare: NonEmptySquare, droppedIndex: number): Board {
    return board.map((square: MaybeEmptySquare, index: number): MaybeEmptySquare => {
        // Each actions precedence is important. Ignore same move, Overwrite, remove, maintain
        if (movedSquare.index == droppedIndex) {
            // This is a redundant check to ensure moves don't count 
            // if a piece was dropped in the same square
            return square
        } else if (square.index == droppedIndex) {
            // Overwrite previous piece

            return { ...square, piece: just({ ...movedSquare.piece, moveCount: movedSquare.piece.moveCount + 1 }) }
        } else if (movedSquare.index == square.index) {
            // remove moved piece
            return { ...square, piece: nothing }
        } else {
            return square
        }
    })
}

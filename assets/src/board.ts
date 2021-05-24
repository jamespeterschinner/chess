import { Maybe, Just, just, Nothing, nothing, map, isJust, unwrap } from './maybe'
// A File in chess is a vertical column
enum File {
  // Listed in reverse order correctly allign SVG coordinates with chess notation
  H, G, F, E, D, C, B, A
}

enum Row {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
}

export interface Coordinates {
  file: File
  row: Row
}

type Index = number

export enum Piece {
  King,
  Queen,
  Bishop,
  Knight,
  Rook,
  Pawn,
}

export enum Player {
  White,
  Black,
}

export type AssignedPiece = {
  owner: Player
  piece: Piece
  moveCount: number
  svgURI: String
}

export type Square<T> = {
  index: number
  coordinates: Coordinates
  piece: T
}

export type EmptySquare = Square<Nothing>
export type NonEmptySquare = Square<AssignedPiece>
export type MaybeEmptySquare = Square<Maybe<AssignedPiece>>


function createAssignedPiece(owner: Player, piece: Piece): AssignedPiece {
  return {
    owner,
    piece,
    moveCount: 0,
    svgURI: require(`~/assets/pieces/${[Player[owner], Piece[piece]].join('-') + '.svg'}`)

  }
}

export type Board = Square<Maybe<AssignedPiece>>[]

export type Model = {
  turn: Player
  boardState: Board
}

const emptyBoard: Square<Nothing>[] = Array(64).fill(null).map(
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
let rowToAssignedPlayer = (row: number): Maybe<Player> => {
  if (row <= 1) {
    return just(Player.White)
  } else if (row >= 6) {
    return just(Player.Black)
  } else {
    return nothing
  }
}

function coordinatesToInitialPiece({ file, row }: Coordinates, player: Player) {
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
          return addPiece(Piece.Queen)
        case 4:
          return addPiece(Piece.King)
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

function addPieceToSquare(
  square: Square<Nothing>
): Square<Maybe<AssignedPiece>> {

  return {
    ...square, piece: map(rowToAssignedPlayer(square.coordinates.row),
      (player) => coordinatesToInitialPiece(square.coordinates, player))
  }
}

export const initialBoard = emptyBoard.map(addPieceToSquare)

console.log(initialBoard)

export function getSquaresWithPieces(board: Board): NonEmptySquare[] {
  return (board
    .filter((square: Square<Maybe<AssignedPiece>>) => isJust(square.piece)) as Square<Just<AssignedPiece>>[])
    .map((square: Square<Just<AssignedPiece>>) => {
      return { ...square, piece: unwrap(square.piece) }
    })
}

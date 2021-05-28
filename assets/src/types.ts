import { Nothing, Maybe } from './maybe'

export enum File {
    // Listed in reverse order correctly allign SVG coordinates with chess notation
    H, G, F, E, D, C, B, A
}

export enum Row {
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

export type Index = number

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
    enPassent: boolean
    moveCount: number
    svgURI: String
}

export type Square<T> = {
    index: number
    coordinates: Coordinates
    piece: T
}

export type Board = Square<Maybe<AssignedPiece>>[]


export type EmptySquare = Square<Nothing>
export type NonEmptySquare = Square<AssignedPiece>
export type MaybeEmptySquare = Square<Maybe<AssignedPiece>>

export interface PredicateArgs {
    square: NonEmptySquare,
    board: Board
    relMove: Coordinates
}

export type Model = {
    turn: Player
    boardState: Board
}

export enum RookType {
    Kings,
    Queens
}


export type Path = Coordinates[]

export type PredicateFunc = (args: PredicateArgs) => boolean

export interface ChangeArgs {
    relMove: Coordinates, // needed for castle change function
    board: Board, // needed to check for king threats
    piece: AssignedPiece,
    previousCoordinates: Coordinates, 
    newCoordinates: Coordinates
}

export interface PieceMove extends ChangeArgs {
    overwrite: { index: Index, piece: AssignedPiece }[]
    remove: Index[]
    possiblyEnPassentable: Index[]
}

// The move logic is constructed in such a manner that Change args are passed to a function which generates 
// Instructions for how to mutate the current board state. This is necessary as en passent, castling, queening  

export type CreateChange = (args: ChangeArgs) => PieceMove

export type MappedMoves = {
    [key: string]: PieceMove
}





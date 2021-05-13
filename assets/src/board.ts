// A File in chess is a vertical column

type Some<T> = { value: T }

function some<T>(value: T) {
    return { value: value }
}

type None = null

const none = null

type Option<T> = Some<T> | None

export function isSome<T>(option: Option<T>): boolean {
    return option != none ? true : false
}

function mapDefaultOption<A, B>(
    option: Option<A>,
    def: Option<B>,
    func: (arg: A) => Option<B>
): Option<B> {
    if (option?.value != undefined) {
        return func(option.value)
    } else {
        return def
    }
}


// Vertical column
enum File {
    A, B, C, D, E, F, G, H
}

enum Row {
    One, Two, Three, Four, Five, Six, Seven, Eight
}

export interface Coordinates {
    file: File,
    row: Row
}

type Index = number

enum Piece {
    King,
    Queen,
    Bishop,
    Knight,
    Rook,
    Pawn
}

export enum Player {
    White,
    Black,
}

export type AssignedPiece = {
    owner: Player
    piece: Piece
}

export type Square = Option<AssignedPiece>

function createAssignedPiece(owner: Player, piece: Piece) {
    return {
        owner: owner,
        piece: piece
    }
}

type Board = Square[]

export type Model = {
    turn: Player
    boardState: Board
}


function emptyBoard(): Board {
    return Array(64).fill(none)
}

function coordinatesToIndex({ file, row }: Coordinates): Index {
    return (row * 8) + file

}

export function indexToCoordinates(index: number): Coordinates {
    return {
        file: Math.floor(index / 8),
        row: index % 8
    }

}
let rowToAssignedPlayer = (row: number): Option<Player> => {
    if (row <= 1) {
        return some(Player.Black)
    } else if (row >= 6) {
        return some(Player.White)
    } else {
        return none
    }
}

function mapCoordinatesToInitalPosition(player: Player, file: number, row: number): Option<AssignedPiece> {
    let addPiece = (piece: Piece) => some(createAssignedPiece(player, piece))
    // Assign pawns
    switch (row) {
        case 1: // Fall-through statement (matches both)
        case 6: return addPiece(Piece.Pawn)
        case 0:
        case 7:
            // Add pieces
            switch (file) {
                case 0: return addPiece(Piece.Rook)
                case 1: return addPiece(Piece.Knight)
                case 2: return addPiece(Piece.Bishop)
                case 3: return addPiece(Piece.Queen)
                case 4: return addPiece(Piece.King)
                case 5: return addPiece(Piece.Bishop)
                case 6: return addPiece(Piece.Knight)
                case 7: return addPiece(Piece.Rook)
            }
        default: return none

    }
}

export function assignedPieceToSVG({owner, piece}: AssignedPiece): string {
    return [Player[owner], Piece[piece]].join("-") + ".svg"
}

export function initializeBoard() {
    return Array(64).fill(none)
        .map((value, index) => indexToCoordinates(index))
        .map(function ({file, row}: Coordinates): [Option<Player>, File, Row] {
            return [rowToAssignedPlayer(row), file, row]
        })
        .map(function ([optionPlayer, file, row]) {
            return mapDefaultOption(
                optionPlayer,
                none,
                (player) =>
                    mapCoordinatesToInitalPosition(player, file, row)

            )
        })
}


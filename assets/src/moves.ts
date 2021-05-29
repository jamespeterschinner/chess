import {
    coordinatesToIndex, getSquareFromCoordinates, generatePath,
    getSquareFromRelativeCoordinates, getPieceFromRelativeCoordinates, moveTowards,
    addCoordinates,
    getPieceFromCoordinates,
    toNonEmptySquare,
    stepTowards,
    getRookCoordinates,
    invertOrientation,
    getKingsCoordinates,
    enableEnPassent,
    disableEnPassent
} from './helpers'
import { Maybe, isJust, nothing, just, filter, defaultMapUnwrap, map, unwrap, Just } from './maybe'
import {
    MaybeEmptySquare, Piece, Player, AssignedPiece,
    Board, Coordinates, PredicateArgs, Index,
    CreateChange, PredicateFunc, ChangeArgs, PossibleMove, Move
} from './types'

/* 
These function are used as preicates to validate whether a move in question can be performed. 
They are composed together to create more complex rules.
*/

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

function pathClearPriorToDestination(args: PredicateArgs) {
    return pathClear({ ...args, relMove: moveTowards(args.relMove, { file: 0, row: 0 }) })
}

function firstMove({ square }: PredicateArgs): boolean {
    return square.piece.moveCount == 0 ? true : false
}

function oppositeColourPiece({ square, board, relMove }: PredicateArgs): boolean {
    let maybePiece = getPieceFromRelativeCoordinates({ square, board, relMove })
    return defaultMapUnwrap(maybePiece, piece => piece.owner != square.piece.owner, false)

}

function rookNotMoved({ square, board, relMove }: PredicateArgs): boolean {
    return defaultMapUnwrap(
        getPieceFromCoordinates(getRookCoordinates(relMove.file, square.piece.owner), board),
        piece => piece.moveCount == 0,
        false
    )
}

function enPassentPredicate({ square, board, relMove: move }: PredicateArgs): boolean {
    // En passent is only allowed for one move implicitly, as the `piece.enpassent` flag is
    // reset on every move, unless it it set for that move.
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

/* 
You can think of this as the heart of the move logic. 

    This function allows us to compose together:
        1. A move in relative coordinates to the current pieces position
        2. How to update the board state if the move is performed
        3. A list of predicates that must all be true for the move to be valid
    
    The function is curried allowing us to specify the move with out knowing the actual position
    of the piece or board configuration.

*/
const predicatedMove = (relMove: Coordinates, change: CreateChange, predicates: PredicateFunc[]) =>
    (args: Omit<PredicateArgs, 'relMove'>): Maybe<PossibleMove> => {

        // Allows all moves to be defined in the perspective of white
        let orientatedMove = (args.square.piece.owner == Player.Black) ?
            invertOrientation(relMove) : relMove
        let predicateArgs = { ...args, relMove: orientatedMove } as PredicateArgs
        let absoluteMove = addCoordinates(args.square.coordinates, orientatedMove)
        return predicates.every(func => func(predicateArgs)) ?
            just(change({
                relMove,
                board: args.board,
                piece: args.square.piece,
                previousCoordinates: args.square.coordinates,
                newCoordinates: absoluteMove
            }))
            : nothing
    }

/*
These functions (ending in ...Change) define how to update the board state. The defaultChange 
does what you expect. It creates instructions telling the update function to move the piece from 
where it started to where it was dropped. This applies to most moves apart from en passent and castling
that require there own instruction for how to perform the move.
*/
function defaultChange(changeArgs: ChangeArgs): PossibleMove {
    return {
        ...changeArgs,
        overwrite: [{ piece: changeArgs.piece, index: coordinatesToIndex(changeArgs.newCoordinates) }],
        remove: [coordinatesToIndex(changeArgs.previousCoordinates)],
        possiblyEnPassentable: []
    }
}

function enableEnPassentChange(args: ChangeArgs): PossibleMove {
    // When a pawn moves two squares next to the other players pawn
    return {
        ...defaultChange(args),
        // Set en passent to true on the moved pawn
        overwrite: [{ index: coordinatesToIndex(args.newCoordinates), piece: { ...args.piece, enPassent: true } }],
        // Also set en passent to true on the neighboring pieces if they exist
        possiblyEnPassentable: [1, -1].map(
            offset => coordinatesToIndex({ ...args.newCoordinates, file: args.newCoordinates.file + offset })
        ),
        remove: [coordinatesToIndex(args.previousCoordinates)]
    }
}

function enPassentChange(args: ChangeArgs): PossibleMove {
    // The actual en passent move, pawn taking opponents pawn behind it
    let change = defaultChange(args)
    return {
        ...change, remove: [
            ...change.remove,
            coordinatesToIndex({ ...args.newCoordinates, row: args.previousCoordinates.row })
        ]
    }
}

function castleChange(args: ChangeArgs): PossibleMove {
    let change = defaultChange(args)
    let newRookIndex = coordinatesToIndex(moveTowards(args.newCoordinates, args.previousCoordinates))
    let oldRookCoordinates = getRookCoordinates(args.relMove.file, args.piece.owner)

    // This move is predicated on the rook being in its initial position. So overriding the type
    // **SHOULD** be safe
    let rookPiece = unwrap(getPieceFromCoordinates(oldRookCoordinates, args.board) as Just<AssignedPiece>)

    return {
        ...change,
        overwrite: [...change.overwrite, { index: newRookIndex, piece: rookPiece }],
        remove: [coordinatesToIndex(args.previousCoordinates), coordinatesToIndex(oldRookCoordinates)]
    }
}

/* 
Here we define all the moves that pieces can make. They are created by composing the above functions
*/
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


const singleKingMoves = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]]
    .map(function ([file, row]) { return predicatedMove({ file, row }, defaultChange, [notOccupiedByOwnPiece]) });

const castleMoves = [
    // You may notice that `notCheck` is absent from the move predicates. The `notCheck` predicate
    // requires generation of all the opponents moves, which requires a call to `possibleMoves` which will
    // eventually result in calls to these functions, creating circular infinite recursion of hell!
    // Instead it is filtered out after all the moves have been generated.
    predicatedMove({ file: -2, row: 0 }, castleChange, [pathClear, firstMove, rookNotMoved]),
    predicatedMove({ file: 2, row: 0 }, castleChange, [pathClear, firstMove, rookNotMoved])
]

const kingMoves = [singleKingMoves, castleMoves].flat()


function generateMovesInDirection(direction: Coordinates, { board, square }: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    // Moves for pieces that move any amount of squares in a direction can't be specified ahead of time 
    // (well not easily) and it would be unintuitive, how WOULD you explain a queen move to a human?
    // Hence they are calculated at runtime.
    type T = Maybe<PossibleMove>
    function* moveGenerator(): Generator<T, any, T> {
        let offset = direction
        while (true) {
            yield predicatedMove(offset, defaultChange, [notOccupiedByOwnPiece, pathClearPriorToDestination])({ board, square })
            offset = addCoordinates(offset, direction)
        }
    }
    let moves: PossibleMove[] = [], moveGen = moveGenerator(), currentMove: T = moveGen.next().value
    while (isJust(currentMove)) {
        map(currentMove, move => moves.push(move))
        currentMove = moveGen.next().value
    }
    return moves

}

function generateRookMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
    return [
        generateMovesInDirection({ file: 0, row: 1 }, args),
        generateMovesInDirection({ file: 0, row: -1 }, args),
        generateMovesInDirection({ file: 1, row: 0 }, args),
        generateMovesInDirection({ file: -1, row: 0 }, args)

    ].flat()
}

function generateBishopMoves(args: Omit<PredicateArgs, 'relMove'>): PossibleMove[] {
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
        case Piece.Bishop: return generateBishopMoves(args)
        case Piece.Rook: return generateRookMoves(args)
        case Piece.Queen: return [generateBishopMoves(args), generateRookMoves(args)].flat()
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



// Same function signature as the move predicates, but can't be used as a predicate due to infinite recursion.
function notCheck(args: Omit<PredicateArgs, 'relMove'>): boolean {
    // Generate a list of index's that the opposite player could move to (on then next turn) if the current move
    // in consideration is played
    let opponentMoveIndexes = listOpponentsMoves(args)
        .map(function ({ newCoordinates }) { return coordinatesToIndex(newCoordinates) })
    // If the players king is could be taken, then this current move is not allowed
    let maybeKingsIndex = map(getKingsCoordinates(args.board, args.square.piece.owner), coordinatesToIndex)
    return defaultMapUnwrap(maybeKingsIndex, kingsIndex => opponentMoveIndexes.every(index => index != kingsIndex), false)
}

function applyChange(board: Board, { overwrite, remove, possiblyEnPassentable }: PossibleMove): Board {
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

export function possibleMovesThatDontThreatenKing(args: Omit<PredicateArgs, 'relMove'>): Move[] {
    let moves: Move[] =
        possibleMoves(args).map(stateChange =>
        ({ coordinates: stateChange.newCoordinates, relMove: stateChange.relMove, board: applyChange(args.board, stateChange) }
        )).filter(({ board }) => notCheck({ ...args, board }))

    // This is an optimisation for the castling rules. It's simpler to remove the possibility to castle
    // if the king can't move one square in the castling direction. Trying to do this in the predicate logic 
    // can end up in infine recursion
    if (args.square.piece.piece == Piece.King) {
        moves = moves.filter(({ relMove, board }: Move) => {
            if(Math.abs(relMove.file) == 2) {
                // The move in consideration is castling. Can castle if the square inbetween it's current 
                // location and destination is not controlled by the opponent and not currently in check
                return moves.some(({ relMove: otherMove }) => otherMove.file == stepTowards(relMove.file, 0)) && notCheck(args)
            } else {
                return true
            }
    })
}
return moves
}





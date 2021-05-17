import { Coordinates } from "./board";

export function xYToCoordinates(scale: number, x: number, y:number): Coordinates {
    return{
        file: Math.floor(x / scale),
        row: Math.floor(y / scale)
    }

}
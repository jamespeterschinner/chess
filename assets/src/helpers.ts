import {Coordinates} from "./board";


export function relXYToCoordinates(scale: number, offsetCoordinates: Coordinates, x: number, y: number): Coordinates {
    let { file, row } = offsetCoordinates;
    return {
        file: Math.round(x / scale) + file,
        row: Math.round(y / scale) + row,
    }

}




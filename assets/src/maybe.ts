export type Just<T> = [NonNullable<T>]

export const nothing = []

export type Nothing = typeof nothing

export type Maybe<T> = Just<T>| Nothing

export function just<T>(t: NonNullable<T>): Maybe<T>{
    return [t]
}

export function map<T, R>(t : Maybe<T>, f: (t: T, index?: number)=> R): Maybe<R>{
    return t.map(f) as Maybe<R>
}

export function isJust<T>(t: Maybe<T>): boolean{
    return t.length == 1? true: false
}

export function unwrap<T>(t: Just<T>){
    return t[0] as T
}
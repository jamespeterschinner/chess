export type Just<T> = [NonNullable<T>]

export const nothing = []

export type Nothing = typeof nothing

export type Maybe<T> = Just<T> | Nothing

export function just<T>(t: NonNullable<T>): Maybe<T> {
    return [t]
}

export function map<T, R>(t: Maybe<T>, f: (t: T, index?: number) => R): Maybe<R> {
    return t.map(f) as Maybe<R>
}

export function isJust<T>(t: Maybe<T>): t is Just<T> {
    // Type guards are runtime checked to TS tuples are actually Arrays
    return Array.isArray(t) && t.length == 1 ? true : false
}

export function unwrap<T>(t: Just<T>) {
    return t[0] as T
}

export function filter<T>(a: Maybe<T>[]): T[] {
    return a.filter(isJust).map(unwrap)
}

export function defaultMapUnwrap<T, D>(t: Maybe<T>, f: (t: T, index?: number) => D, d: D): D {
    let maybeResult = map(t, f)
    return isJust(maybeResult) ? unwrap(maybeResult) : d
}

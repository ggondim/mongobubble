export type Falsy = undefined | null | false;
export type PrimitiveValidIndexSignature = string | number | symbol;
export type Primitive = PrimitiveValidIndexSignature | boolean;
export type Complex = Primitive | Array<Primitive> | {
  [k: PrimitiveValidIndexSignature]: Complex
} | Date;
export type FalsyOrLiteral = Falsy | Primitive;

export const isFalsyOrSpaces = (i: FalsyOrLiteral) => {
  if (typeof i === 'number' && i === 0) return false;
  return ((typeof i === 'string' && i.trim() === '') || (!i));
};

type TreeItem<T> = T & { children: TreeItem<T>[] };

export function buildTree<T>(array: T[], elementKey: keyof T, parentKey: keyof T): TreeItem<T>[] {
  const tree = [] as TreeItem<T>[];
  for (let i = 0; i < array.length; i++) {
    if (array[i][parentKey]) {
      const parent = array
        .filter(elem => elem[elementKey] === array[i][parentKey]).pop() as TreeItem<T>;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(array[i] as TreeItem<T>);
    } else {
      tree.push(array[i] as TreeItem<T>);
    }
  }
  return tree;
}

export class ClonableType<T> {
  constructor(obj?: Partial<T>) {
    if (obj) Object.assign(this, obj);
  }
}

export function getMethods(obj): string[] {
  const properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  // eslint-disable-next-line no-cond-assign
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()]
    .filter(item => typeof obj[item as PrimitiveValidIndexSignature] === 'function')
    .map(i => i.toString());
}

export interface EmptyConstructorOf<T> {
  new(): T;
}

export enum LogLevel {
  Debug = '0:debug',
  Verbose = '0:verbose',
  Info = '1:verbose',
  Warn = '2:warn',
  Error = '3:error',
  Nothing = '100:nothing',
}

export function equals(a: any, b: any): boolean {
  return (a === b) || (typeof a.equals === 'function' && a.equals(b));
}

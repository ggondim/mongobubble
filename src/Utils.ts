export type Falsy = undefined | null | false;
export type ValidIndexSignature = string | number | symbol;
export type Primitive = ValidIndexSignature | boolean;
export type Complex = Primitive | Array<Primitive> | { [k: ValidIndexSignature]: unknown };
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

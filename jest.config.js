/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        compiler: 'typescript',
        tsconfig: {
            "rootDir": "./",
            "esModuleInterop": true,
            "noImplicitAny": false,
            "outDir": "./distTests",
            "declaration": true,
            "inlineSourceMap": true,
            "noEmitOnError": true,
            "removeComments": false,
            "module": "CommonJS",
            "moduleResolution": "Node",
            "lib": [
              "ES2021",
            ],
            "types": [
              "node"
            ],
            "target": "ES2020"
        }
      },
    ],
  },

};

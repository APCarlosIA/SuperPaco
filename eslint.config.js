/**
 * @file Configuración de ESLint (análisis estático del código).
 *
 * ESLint revisa el código sin ejecutarlo y avisa de errores que los tests no
 * siempre detectan: variables sin definir, importaciones que no se usan,
 * comparaciones con `==`, variables que deberían ser `const`…
 *
 * Uso: `npm run lint`.
 *
 * Nota: ESLint exige que este archivo use `export default`; la regla del
 * proyecto de "solo exportaciones con nombre" se aplica al código de `src/`.
 */
import javascriptRecommended from '@eslint/js';
import globals from 'globals';

/** Reglas comunes a todo el proyecto, además de las recomendadas por ESLint. */
const PROJECT_RULES = {
  // Importaciones y variables sin usar. Los parámetros no se revisan porque los
  // métodos base (p. ej. `update(world)`) documentan parámetros que no usan.
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
  // Siempre `===` y `!==`: evita conversiones de tipo sorprendentes.
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  // Permite `if (x) return;` en una línea, pero exige llaves en bloques de varias líneas.
  curly: ['error', 'multi-line'],
  // Una variable local no debe llamarse igual que otra de un ámbito superior.
  'no-shadow': 'error',
  'no-console': ['error', { allow: ['warn', 'error'] }]
};

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  javascriptRecommended.configs.recommended,
  {
    // Código del juego: se ejecuta en el navegador.
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: PROJECT_RULES
  },
  {
    // Herramientas, tests y configuración: se ejecutan en Node.
    files: ['tools/**/*.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { ...PROJECT_RULES, 'no-console': 'off' }
  }
];

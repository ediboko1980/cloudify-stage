/**
 * Like `useState`, but allows to reset the value back to the initial one using function returned as the third array element.
 *
 * @param initialValue
 * @returns {(any|((value: unknown) => void)|(function(): void))[]}
 */
function useResettableState(initialValue) {
    const { useState } = React;

    const [value, setValue] = useState(initialValue);

    return [value, setValue, () => setValue(initialValue)];
}

Stage.defineHook({ useResettableState });

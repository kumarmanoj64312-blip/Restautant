import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";

/**
 * Runs an async fetcher and tracks its result.
 * Pass a memoised fetcher (useCallback); a new fetcher identity triggers a new request.
 *
 * - loading:    no usable data yet (first load, filter change, or retry after an error)
 * - refreshing: reload() in progress while old data is still shown
 * - setData:    patch the cached data locally after a mutation
 */
const useRequest = (fetcher) => {
    const [nonce, setNonce] = useState(0);
    const [state, setState] = useState({ source: null, nonce: -1, data: undefined, error: "" });

    useEffect(() => {
        let active = true;

        fetcher().then(
            (data) => {
                if (active) setState({ source: fetcher, nonce, data, error: "" });
            },
            (error) => {
                if (active) setState({ source: fetcher, nonce, data: undefined, error: getErrorMessage(error) });
            }
        );

        return () => {
            active = false;
        };
    }, [fetcher, nonce]);

    const reload = useCallback(() => setNonce((value) => value + 1), []);

    const setData = useCallback(
        (updater) =>
            setState((prev) => ({
                ...prev,
                data: typeof updater === "function" ? updater(prev.data) : updater,
            })),
        []
    );

    const pending = state.source !== fetcher || state.nonce !== nonce;
    const loading = pending && (state.source !== fetcher || !!state.error || state.data === undefined);

    return {
        data: state.data,
        error: pending ? "" : state.error,
        loading,
        refreshing: pending && !loading,
        reload,
        setData,
    };
};

export default useRequest;

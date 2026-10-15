import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LogIn, LogOut, Timer } from "lucide-react";
import { clockIn, clockOut, getAttendanceStatus } from "../../../api/attendanceApi";
import { getErrorMessage } from "../../../api/client";
import { Button, Card, Skeleton } from "../../../components/ui";
import useRequest from "../../../hooks/useRequest";
import { formatElapsed, formatMinutes, formatTime } from "../hrUtils";

const fetchStatus = async () => (await getAttendanceStatus())?.data;

// "Ready to start your day?" card with the clock in / out button
const ClockCard = ({ onChange }) => {
    const { data: status, loading, setData } = useRequest(fetchStatus);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    // Tick every second while clocked in
    useEffect(() => {
        if (!status?.clockedIn) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [status?.clockedIn]);

    const handleClick = async () => {
        try {
            setBusy(true);
            const response = await (status?.clockedIn ? clockOut() : clockIn());
            setData(response?.data);
            setNow(Date.now());
            toast.success(status?.clockedIn ? "Clocked out. See you next shift!" : "Clocked in. Have a good shift!");
            onChange?.();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update your attendance."));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <Skeleton className="mb-6 h-28" />;

    const clockedIn = !!status?.clockedIn;
    const workedToday = status?.today?.workedMinutes || 0;

    return (
        <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                            clockedIn ? "bg-green-50 text-success" : "bg-brand-soft text-brand"
                        }`}
                    >
                        <Timer size={24} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-ink">{clockedIn ? "You're on the clock" : "Ready to start your day?"}</h2>
                        <p className="text-sm text-muted">
                            Current status:{" "}
                            <span className={`font-semibold ${clockedIn ? "text-success" : "text-ink"}`}>
                                {clockedIn ? `Clocked in at ${formatTime(status.since)}` : "Clocked out"}
                            </span>
                            {workedToday > 0 && !clockedIn && <> · {formatMinutes(workedToday)} hrs today</>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {clockedIn && (
                        <span className="font-mono text-2xl font-bold tabular-nums text-ink" aria-label="Time on this shift">
                            {formatElapsed(status.since, now)}
                        </span>
                    )}
                    <Button
                        size="lg"
                        icon={clockedIn ? LogOut : LogIn}
                        loading={busy}
                        onClick={handleClick}
                        className={clockedIn ? "!bg-danger hover:!bg-red-700" : "!bg-success hover:!bg-green-800"}
                    >
                        {clockedIn ? "Clock Out" : "Clock In"}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ClockCard;

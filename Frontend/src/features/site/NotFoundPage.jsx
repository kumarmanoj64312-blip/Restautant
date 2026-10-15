import { ArrowLeft, Home, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
            <div className="max-w-md animate-fade-up text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft text-brand">
                    <UtensilsCrossed size={36} aria-hidden="true" />
                </span>
                <p className="eyebrow mt-8">Error 404</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
                    This plate is empty
                </h1>
                <p className="mt-4 text-muted">
                    The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to
                    something tasty.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button to="/" icon={Home} size="lg">
                        Back to home
                    </Button>
                    <Button variant="outline" icon={ArrowLeft} size="lg" onClick={() => navigate(-1)}>
                        Go back
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default NotFoundPage;

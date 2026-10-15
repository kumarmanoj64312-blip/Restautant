import { Store } from "lucide-react";
import { Button, Card, EmptyState } from "../../components/ui";
import { getRoleHomePath } from "../../utils/format";

// Shown on cart/checkout when a staff account is signed in
const StaffNotice = ({ role }) => (
    <Card padding="none">
        <EmptyState
            icon={Store}
            title="Online ordering is for customers"
            description="You're signed in with a staff account. Use your workspace to take orders for guests, or sign in with a customer account to order online."
            action={<Button to={getRoleHomePath(role)}>Go to my workspace</Button>}
        />
    </Card>
);

export default StaffNotice;

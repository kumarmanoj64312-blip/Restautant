import User from "../models/User.js";
import Menu from "../models/Menu.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import { ROLES, ORDER_STATUS, PAYMENT_STATUS } from "../constants/roles.js";

// ========================================
// Dashboard Statistics
// ========================================
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({
            role: ROLES.CUSTOMER,
        });

        const totalMenus = await Menu.countDocuments();

        const totalCategory =
            await Category.countDocuments();

        const totalOrders =
            await Order.countDocuments();

        const pendingOrders =
            await Order.countDocuments({
                orderStatus: ORDER_STATUS.PENDING,
            });

        const completedOrders =
            await Order.countDocuments({
                orderStatus: ORDER_STATUS.DELIVERED,
            });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayOrders =
            await Order.countDocuments({
                createdAt: {
                    $gte: todayStart,
                    $lte: todayEnd,
                },
            });

        const revenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalAmount",
                    },
                },
            },
        ]);

        const totalRevenue =
            revenue.length > 0
                ? revenue[0].totalRevenue
                : 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalMenus,
                totalCategory,
                totalOrders,
                pendingOrders,
                completedOrders,
                todayOrders,
                totalRevenue,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ========================================
// Recent Orders
// ========================================
export const getRecentOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({
                createdAt: -1,
            })
            .limit(5);

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
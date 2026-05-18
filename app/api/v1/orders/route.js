// app/api/v1/orders/route.js (updated version)
import { NextResponse } from 'next/server';
import { connectToDatabase, withPrimaryWrite } from '@/app/lib/mongodb';
import Order from '@/app/models/Order';

// Helper function to generate order number with retry
const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const startOfDay = new Date(year, month - 1, day);
  const endOfDay = new Date(year, month - 1, day + 1);
  
  const todayOrdersCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const sequence = String(todayOrdersCount + 1).padStart(4, '0');
  return `ORD-${year}${month}${day}-${sequence}`;
};

// POST - Create a new order
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    const {
      items,
      customer,
      subtotal,
      deliveryCharge,
      discount,
      total,
      couponCode
    } = body;

    // Your existing validations...
    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Cart is empty"
      }, { status: 400 });
    }

    if (!customer) {
      return NextResponse.json({
        success: false,
        message: "Customer information is required"
      }, { status: 400 });
    }

    const requiredCustomerFields = ['name', 'district', 'policeStation', 'address', 'phone'];
    for (const field of requiredCustomerFields) {
      if (!customer[field] || customer[field].toString().trim() === '') {
        return NextResponse.json({
          success: false,
          message: `${field} is required`
        }, { status: 400 });
      }
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customer.phone)) {
      return NextResponse.json({
        success: false,
        message: "Invalid phone number format. Use 01XXXXXXXXX"
      }, { status: 400 });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Prepare order data
    const orderData = {
      products: items.map(item => ({
        productId: item._id,
        name: item.name,
        SKU: item.SKU,
        sellingPrice: item.sellingPrice,
        originalPrice: item.originalPrice,
        amount: item.selectedQuantity,
        photos: item.photos,
        slug: item.slug,
        maxQuantity: item.maxQuantity
      })),
      payment: {
        method: "Cash on Delivery",
        status: "Pending",
        amount: total
      },
      lastNumber: orderNumber,
      subTotal: subtotal,
      customer: {
        name: customer.name,
        district: customer.district,
        policeStation: customer.policeStation,
        address: customer.address,
        phone: customer.phone,
        email: customer.email || "",
      },
      deliveryCharge: deliveryCharge.toString(),
      defaultDiscount: 0,
      customDiscount: discount > 0 ? discount.toString() : "",
      couponCode: couponCode || "",
      couponDiscount: discount > 0 ? discount.toString() : "",
      courierTrackingId: "",
      status: "Pending Confirmation"
    };

    // Use the withPrimaryWrite helper to handle "not primary" errors
    const order = await withPrimaryWrite(async () => {
      return await Order.create(orderData);
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderId: order._id,
        orderNumber: order.lastNumber,
        total: order.subTotal + parseInt(order.deliveryCharge) - (parseInt(order.couponDiscount) || 0),
        status: order.status,
        orderDate: order.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.code === 10107) {
      return NextResponse.json({
        success: false,
        message: "Database is currently unavailable. Please try again.",
        error: "Primary node unavailable - please retry"
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Failed to place order",
      error: error.message
    }, { status: 500 });
  }
}


// GET - Fetch orders (optional - for admin or user order history)
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const orderId = searchParams.get('orderId');
    
    let query = {};
    
    if (phone) {
      query['customer.phone'] = phone;
    }
    
    if (orderId) {
      query._id = orderId;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json({
      success: true,
      count: orders.length,
      orders
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    }, { status: 500 });
  }
}
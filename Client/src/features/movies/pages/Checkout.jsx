import React, { useCallback, useEffect, useMemo, useState} from 'react';
import { Alert, Button, Card, Collapse, Divider, Radio, Space, Spin, Typography } from 'antd'
import { 
    BankOutlined, 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    CreditCardOutlined, 
    DownCircleOutlined, 
    ExclamationCircleOutlined, 
    InfoCircleOutlined, 
    LoadingOutlined, 
    MobileOutlined, 
    WalletOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import { 
    selectValidationResult, validateSeatBookingRequest,
    selectRazorpayOrder, selectIsPaymentProcessing, selectPaymentError, createRazorpayOrderRequest,
    selectBookingLoading, selectBookingData, bookSeatsRequest
} from '../../../redux/slices/bookingSlice';
import { useAuth } from '../../../hooks/useAuth';
import { useBooking } from '../../../hooks/useBooking';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../../utils/notificationUtils';
import { useDispatch, useSelector } from 'react-redux';
const { Title ,Text, Paragraph } = Typography;
const { Panel } = Collapse; 
const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

const PaymentSummary = React.memo(({show, seats, handlePreviousStep}) => {
    const { user } = useAuth(); 
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const validationResult = useSelector(selectValidationResult);
    const razorpayOrder = useSelector(selectRazorpayOrder);
    const isPaymentProcessing = useSelector(selectIsPaymentProcessing);
    const paymentError = useSelector(selectPaymentError);
    const validationLoading= useSelector(selectBookingLoading);
    const bookingData = useSelector(selectBookingData);

    console.log(razorpayKey);

    // const { validateSeatBooking, validationResult, loading: validationLoading } = useBooking()
    // const [isPaymentProcessing, setIsProcessingPayment] = useState(false)

    const [paymentStatus, setPaymentStatus] = useState("") // 'processing', 'success', 'failed'
    const [paymentMethod, setPaymentMethod] = useState("UPI")
    const [deviceType, setDeviceType] = useState('desktop')
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)
    const maxRetries = 3

    const [feePerTicket] = useState(Math.floor(Math.random() * (20 - 15 + 1)) + 15);
    const ticketAmount = useMemo(() => show.ticketPrice * seats.length, [show, seats]);
    const baseAmount = useMemo(() => feePerTicket * seats.length, [feePerTicket, seats]);
    const gst = useMemo(() => baseAmount * 0.18, [baseAmount]);
    const convenienceFee = useMemo(() => baseAmount + gst, [baseAmount, gst]);
    const totalAmount = useMemo(() => ticketAmount +  convenienceFee, [ticketAmount, convenienceFee]);

    // Enhanced device detection with debouncing
    useEffect(() => {
        const getDeviceType = (width) => {
            if (width < 640) return 'mobile'
            if (width < 1024) return 'tablet'
            return 'desktop'
        }

        const handleResize = () => {
            const width = window.innerWidth
            setWindowWidth(width)
            setDeviceType(getDeviceType(width))
        }

        // Initial check
        handleResize()

        // Debounced resize handler
        let timeoutId
        const debouncedResize = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleResize, 150)
        }

        window.addEventListener("resize", debouncedResize)
        return () => {
            window.removeEventListener("resize", debouncedResize)
            clearTimeout(timeoutId)
        }
    }, [])

    // Computed responsive values
    const isMobile = deviceType === 'mobile'
    const isTablet = deviceType === 'tablet'
    const isDesktop = deviceType === 'desktop'

    const loadRazorpayScript = useCallback(() => {
        return new Promise((resolve) => {
            // Check if script already exists
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log("Razorpay SDK loaded successfully");
                resolve(true);
            };

            script.onerror = (error) => {
                console.error("Failed to load Razorpay SDK:", error);
                setError("Failed to load payment gateway. Please check your internet connection.");
                resolve(false);
            };
            document.body.appendChild(script);
        });
    }, []);

    const validateSeatAvailability = useCallback(async () => {
        try 
        {
            console.log("Validating seat availability for: ", seats)
            setError(null)
            
            // Use Redux action to validate seats
            dispatch(validateSeatBookingRequest({ showId: show._id, seats }))
            // validateSeatBooking({ showId: show._id, seats })

            // Wait for validation result
            return new Promise((resolve) => {
                let attempts = 0
                const maxAttempts = 50 

                const checkResult = () => {
                    attempts++
                    console.log(`Validation attempt ${attempts}:`, validationResult)

                    if(validationResult)
                    {
                        if (validationResult.success) 
                        {
                            resolve(true)
                        } 
                        else 
                        {
                            setError(validationResult.message || "Seats are no longer available")
                            resolve(false)
                        }
                    }
                    else if(!validationLoading && attempts > 10)
                    {
                        // If not loading and we've waited enough, assume failure
                        setError("Unable to validate seat availability. Please try again.")
                        resolve(false)
                    }
                    else if (attempts >= maxAttempts) 
                    {
                        setError("Validation timeout. Please try again.")
                        resolve(false)
                    }
                    else
                    {
                        // Still loading check again
                        setTimeout(checkResult, 100)
                    }
                }
                checkResult()
            })
        } 
        catch (error) 
        {
            console.error("Seat validation error: ", error)
            setError("Failed to validate seats. Please try again.")
            return false
        }
    }, [seats, show._id, validationResult, validationLoading]);

    const handleRazorPaymentSucess = useCallback(
        async(payment) => {
            try {
                console.log("Processing booking after succesful payment: ", payment);

                // Send these to backend to verify & book
                const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment;

                const { amount: order_amount, receipt: order_receipt } = razorpayOrder;

                const bookingPayload = {
                    show: show._id,
                    user: user._id,
                    seats,
                    transactionId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    receipt: order_receipt,
                    amount: order_amount,
                    convenienceFee : convenienceFee,
                    signature: razorpay_signature,
                }

                dispatch(bookSeatsRequest(bookingPayload))

                return new Promise((resolve) => {
                    let attempts = 0
                    const maxAttempts = 50

                    const checkBookingStatus = () => {
                        attempts++
                        console.log(`Booking Attempt ${attempts}: `, bookingData)
                        if(bookingData)
                        {
                            setPaymentStatus("success");
                            notify("success", "Booking Confirmed! Redirecting...");

                            setTimeout(()=> {
                                navigate("/my-profile/purchase-history");
                            }, 1500) 
                            resolve(true);                           
                        }
                        else if (paymentError && attempts > 5) {
                            notify("error", "Booking failed after payment. Please contact support.")
                            setPaymentStatus("failed")
                            resolve(false)
                        }
                        else if (attempts >= maxAttempts) 
                        {
                            notify("warning", "Booking confirmation timeout. Your seats are reserved.")
                            setPaymentStatus("success")
                            setTimeout(() => {
                                navigate("/my-profile/purchase-history");
                            }, 2000)
                            resolve(true)
                        }
                        else
                        {
                            setTimeout(checkBookingStatus, 100)
                        }
                    }
                    checkBookingStatus()
                })
            } catch (error) {
                console.log("Error in Booking after payment: ", error);
                notify(
                    "error", 
                    `Booking failed. Please contact support with your payment ID: ${razorpay_payment_id}`
                );
                setPaymentStatus("failed");
            }
        },
        [show._id, seats, paymentMethod, totalAmount, bookingData, paymentError, navigate]
    );

    const handleRazorPay = useCallback(async () => {
        if(isPaymentProcessing)
        {
            notify("warning", "Payment is already in progress. Please wait...");
            return;
        }

        try 
        {
            setPaymentStatus("processing");
            setError(null);

            const seatsAvailable = await validateSeatAvailability();

            if(!seatsAvailable)
            {
                notify("error", error || "Selected seats are no longer available. Please select different seats.");
                setPaymentStatus("failed");
                return;
            }

            // Create payment order
            const amount = Number.parseFloat(totalAmount.toFixed(2));
        
            dispatch(createRazorpayOrderRequest({ amount }));

            const { id: order_id, amount: order_amount, receipt: order_receipt } = razorpayOrder;

            return new Promise((resolve) => {
                    let attempts = 0
                    const maxAttempts = 50

                    const checkOrderCreation = () => {
                        attempts++
                        if(razorpayOrder && razorpayOrder.id)
                        {
                            loadRazorpayScript().then((loaded) => {
                                if(loaded && window.Razorpay)
                                {
                                    
                                    const options = {
                                        key: razorpayKey, // Razorpay key
                                        amount: order_amount,
                                        currency: "INR",
                                        name: "BookMyShow",
                                        description: `Movie Ticket Booking - ${show.movie.movieName}`,
                                        order_id,
                                        handler: async function (response) {
                                            console.log("Payment Successful, processing booking...", response.razorpay_payment_id)
                                            await handleRazorPaymentSucess(response)
                                        },
                                        modal: {
                                            ondismiss: () => {
                                                console.log("Payment modal dismissed");
                                                // setIsProcessingPayment(false);
                                                // setPaymentStatus("");
                                                notify("info", "Payment cancelled");
                                            }
                                        },
                                        prefill: {
                                            name: user?.name || "",
                                            email: user?.email || "",
                                            contact: user?.phone || "",
                                        },
                                        theme: {
                                            color: "#F37254",
                                        },
                                        notes: {
                                            booking_type: "movie_ticket",
                                            show_id: show._id,
                                            seats: seats.join(",")
                                        }
                                    }
                                    const paymentObject = new window.Razorpay(options);
                                    paymentObject.open();
                                }
                            })
                            resolve(true);
                        }
                        else if(paymentError && attempts > 5)
                        {
                            notify("error", paymentError || "Failed to create payment order");
                            setPaymentStatus("failed");
                            resolve(false);
                        }
                        else if(attempts >= maxAttempts)
                        {
                            notify("error", "Payment initialization timeout");
                            setPaymentStatus("failed");
                            resolve(false);
                        }
                        else
                        {
                            setTimeout(checkOrderCreation, 100);
                        }
                    }
                    checkOrderCreation()
                })
        } 
        catch (error) 
        {
            console.log("Payment error: ", error);
            setError(error.message);
            notify("error", error.message);
            setPaymentStatus("failed");
        }
    }, [
        isPaymentProcessing,
        validateSeatAvailability,
        totalAmount,
        razorpayOrder,
        paymentError,
        error,
        loadRazorpayScript,
        show._id,
        user,
        seats,
        convenienceFee,
        paymentMethod,
        navigate,
        handleRazorPaymentSucess
    ])

    const renderPaymentStatus = useCallback(() => {
        if(paymentStatus === "processing")
        {
            return (
                <div className='text-center py-6'>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 32}} spin />} />
                    <div className='mt-3 text-gray-600 text-base'>Initializing payment...</div>
                    <div className="mt-1 text-gray-500 text-sm">Please wait while we process your request</div>
                </div>
            )
        }

        if(paymentStatus === "success")
        {
            return (
                <div className='text-center py-6'>
                    <CheckCircleOutlined style={{fontSize: 32, color: '#52c41a'}} />
                    <div className='mt-3 text-green-600 text-base font-medium'>
                        Payment Successful! Confirming your booking...
                    </div>
                    <div className='mt-2 text-gray-500 text-sm'>You will be redirected to your booking history shortly.</div>
                </div>
            )
        }

        if (paymentStatus === "failed") {
            return (
                <div className='text-center py-6'>
                    <CloseCircleOutlined style={{fontSize: 32, color: '#ff4d4f'}} />
                    <div className='mt-3 text-red-600 text-base font-medium'>
                        Payment Failed
                    </div>
                    <div className='mt-2 text-gray-500 text-sm'>Please try again or contact support if the issue persists.</div>
                </div>
            );
        }

        return null;
    }, [paymentStatus])

    const renderErrorAlert = useCallback(() => {
        if (!error) return null;

        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                className="mb-4"
                action={
                    retryCount < maxRetries && (
                        <Button 
                            size="small" 
                            onClick={() => {
                                setRetryCount(prev => prev + 1);
                                setError(null);
                                handleRazorPay();
                            }}
                        >
                            Retry
                        </Button>
                    )
                }
            />
        );
    }, [error, retryCount, maxRetries, handleRazorPay]);

    const paymentMethods = useMemo(() => [
        {
            key: "UPI",
            icon: <MobileOutlined className="text-lg" />,
            title: "UPI",
            description: "Google Pay, PhonePe, Paytm & more",
            popular: true,
            disabled: false,
        },
        {
            key: "CARD",
            icon: <CreditCardOutlined className="text-lg" />,
            title: "Credit/Debit Card",
            description: "Pay securely with your card",
            popular: false,
            disabled: false,
        },
        {
            key: "NET BANKING",
            icon: <BankOutlined className="text-lg" />,
            title: "Net Banking",
            description: "All major banks supported",
            popular: false,
            disabled: false,
        },
        {
            key: "WALLET",
            icon: <WalletOutlined className="text-lg" />,
            title: "Wallet",
            description: "Amazon Pay, Paytm & more",
            popular: false,
            disabled: false,
        },
    ], []);

    return (
        <div 
            className={`payment-summary ${isMobile ? "mobile-payment" : ""} ${isTablet ? "tablet-payment" : ""}`}
            role="main"
            aria-label="Payment Summary"
        >
            <Title level={4} className="mb-4! text-lg! md:text-xl!">
                Payment Summary
            </Title>

            {/* Error Alert */}
            {renderErrorAlert()}

            {/* Payment Status */}
            {
                (paymentStatus === "processing" || paymentStatus === "success" || paymentStatus === "failed") && (
                    <Card className="mb-6! border-blue-200! bg-blue-50!">
                        {renderPaymentStatus()}
                    </Card>
                )
            }
            <Card className="mb-4! shadow-sm!">
                <div className='mb-4'>
                    <Title level={5} className="mb-2! text-base! md:text-lg!">
                        {show.movie.movieName}
                    </Title>
                    <Space direction="vertical" size={2} className="mb-0!">
                        <Text type="secondary" className="text-sm! md:text-base!">
                            {show.theatre.name}
                        </Text>
                        <Text type="secondary" className="text-sm! md:text-base!">
                            Seats - {seats.join(', ')} ({seats.length} Tickets)
                        </Text>
                        <Text type="secondary" className="text-sm! md:text-base!">
                        {moment(show.date).format("ddd, DD MMM, YYYY")} | {moment(show.time, "HH:mm").format("hh:mm A")}
                        </Text>
                    </Space>
                </div>
            </Card>

            <Card className="mb-4! shadow-sm!">
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <Text className="text-sm! md:text-base! text-gray-800!">
                            Ticket Price ({seats.length} × ₹{show.ticketPrice})
                        </Text>
                        <Text className="text-sm! md:text-base! font-medium! text-gray-900!">
                            ₹{ticketAmount.toFixed(2)}
                        </Text>
                    </div>

                    <Collapse 
                        bordered={false}
                        ghost 
                        expandIconPosition="start" 
                        className="custom-collapse bg-transparent! p-0!"
                        expandIcon={({ isActive }) => (
                            <DownCircleOutlined rotate={isActive ? -180 : 0} className="text-gray-500!"/>
                        )}
                    >
                        <Panel
                            header={
                                <div className="flex justify-between w-full">
                                    <Text className="text-sm! md:text-base! text-gray-800!">
                                        Convenience Fee
                                        </Text>
                                    <Text className="text-sm! md:text-base! font-medium! text-gray-900!">
                                        ₹{(convenienceFee).toFixed(2)}
                                    </Text>
                                </div>
                            }
                            key="1"
                            className="border-0!"
                        >
                            <div className="space-y-2 pl-0 pt-2 border-t border-gray-100">
                                <div className="flex! justify-between!">
                                    <Text type='secondary' className="text-xs! md:text-sm!">
                                        Base Amount
                                    </Text>
                                    <Text type='secondary' className="text-xs! md:text-sm!">
                                        ₹{baseAmount.toFixed(2)}
                                    </Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text type='secondary' className="text-xs! md:text-sm!">
                                        Integrated GST (IGST) @18%
                                    </Text>
                                    <Text type='secondary' className="text-xs! md:text-sm!">
                                        ₹{gst.toFixed(2)}
                                    </Text>
                                </div>
                            </div>
                        </Panel>
                    </Collapse>
                </div>

                <Divider className="my-4!" />

                <div className='flex justify-between items-center'>
                    <Title level={5} className="mb-0! text-base! md:text-lg!">
                        Amount Payable
                    </Title>
                    <Title level={5} className="mb-0! text-lg! md:text-xl! text-[#f84464]!">
                        ₹{totalAmount.toFixed(2)}
                    </Title>
                </div>
            </Card>

            <Card className="mb-4! shadow-sm!">
                <Title level={5} className="mb-4! text-base! md:text-lg!">
                    Select Payment Method
                </Title>
                <Radio.Group 
                    value={paymentMethod} 
                    className="w-full!" 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    aria-label="Payment method selection"
                >
                    <div 
                        className={`grid gap-3 ${
                            isMobile ? "grid-cols-1" : 
                            isTablet ? "grid-cols-2" : 
                            "grid-cols-2"
                        }`}
                    >
                        {paymentMethods.map((method) => (
                            <Radio
                                key={method.key}
                                value={method.key}
                                disabled={method.disabled || isPaymentProcessing}
                                className="border! p-3! md:p-4! rounded-lg! hover:border-[#f84464]! transition-colors w-full! m-0!"
                                aria-describedby={`${method.key}-description`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-[#f84464]">
                                        {method.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                        <Text strong className="text-sm! md:text-base!">
                                            {method.title}
                                        </Text>
                                        {method.popular && (
                                            <span 
                                                className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full"
                                                aria-label="Popular payment method"
                                            >
                                                Popular
                                            </span>
                                        )}
                                        </div>
                                        <Text 
                                            type="secondary" 
                                            className="text-xs! md:text-sm! block mt-1"
                                            id={`${method.key}-description`}
                                        >
                                            {method.description}
                                        </Text>
                                    </div>
                                </div>
                            </Radio>
                        ))}
                    </div>
                </Radio.Group>
            </Card>

            <div className="bg-gray-50 p-3 md:p-4 rounded-lg mb-6">
                <div className="flex items-start gap-2">
                    <InfoCircleOutlined className="text-gray-500! shrink-0! mt-1!" />
                    <Paragraph type="secondary" className="text-xs! md:text-sm! mb-0!">
                        By proceeding, you agree to our{" "}
                        <a 
                            href="#" 
                            className="text-blue-600! hover:text-blue-800! underline!"
                            aria-label="Read Terms and Conditions"
                        >
                            Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a 
                            href="#" 
                            className="text-blue-600! hover:text-blue-800! underline!"
                            aria-label="Read Cancellation Policy"
                        >
                            Cancellation Policy
                        </a>
                        . A confirmation will be sent to your email and phone number.
                    </Paragraph>
                </div>
            </div>

            <div className={`flex gap-3 ${
                    isMobile ? "flex-col" : 
                    isTablet ? "flex-row justify-between" : 
                    "flex-row justify-between"
                }`}
            >
                <Button 
                    size="large" 
                    onClick={handlePreviousStep}
                    disabled={isPaymentProcessing}
                    className={`${isMobile ? "order-2" : ""} min-h-12! w-full! ${isMobile ? "w-full!" : "w-auto!"}`}
                    aria-label="Go back to seat selection"
                >
                    Back
                </Button>
                <Button 
                    type="primary"
                    size="large" 
                    loading={isPaymentProcessing}
                    disabled={isPaymentProcessing}
                    onClick= {handleRazorPay}
                    className={`bg-[#f84464]! hover:bg-[#dc3558]! ${isMobile ? "order-1" : ""} min-h-12! ${
                        isMobile ? "text-base! font-semibold! w-full!" : "w-auto!"
                    }`}
                    aria-label={`Pay ₹${totalAmount.toFixed(2)} using ${paymentMethod}`}
                >
                    {isPaymentProcessing ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>
            </div>

            {/* Mobile Sticky Footer */}
            {isMobile && !isPaymentProcessing && (
                <div 
                    className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg"
                    role="complementary"
                    aria-label="Mobile payment summary"
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <div className="text-sm font-medium">Total Amount</div>
                                <div className="text-lg font-bold text-[#f84464]">₹{totalAmount.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-600">{seats.length} tickets</div>
                                <div className="text-xs text-gray-600">
                                    {paymentMethods.find((m) => m.key === paymentMethod)?.title}
                                </div>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            loading={isPaymentProcessing}
                            disabled={isPaymentProcessing}
                            onClick={handleRazorPay}
                            className="bg-[#f84464]! hover:bg-[#dc3558]! w-full min-h-12! text-base! font-semibold!"
                            aria-label={`Pay ₹${totalAmount.toFixed(2)} using ${paymentMethod}`}
                        >
                            {isPaymentProcessing ? "Processing..." : `Pay Now ₹${totalAmount.toFixed(2)}`}
                        </Button>
                    </div>
                </div>
            )}

            {/* Mobile bottom spacing */}
            {isMobile && <div className="h-32" />}
        </div>
    )
});

export default PaymentSummary
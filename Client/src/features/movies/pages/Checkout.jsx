import React, { useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import { 
    selectValidationResult, validateSeatBookingRequest,
    selectRazorpayOrder, selectIsPaymentProcessing, selectPaymentError, 
    createRazorpayOrderRequest, bookSeatsRequest, clearValidationResult, clearBookingData,
    selectBookingData, selectBookingError
} from '../../../redux/slices/bookingSlice';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../../utils/notificationUtils';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, formatParsedTime } from '../../../utils/dateFormatter';
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
    const bookingData = useSelector(selectBookingData);
    const bookingError = useSelector(selectBookingError)

    /*
    * paymentStatus controls what the user sees.
    *
    * ""           -> normal payment screen
    * "processing" -> payment workflow in progress
    * "success"    -> booking confirmed
    * "failed"     -> workflow failed
    */
    const [paymentStatus, setPaymentStatus] = useState("")

    /*
    * paymentStage controls the async workflow.
    *
    * idle
    * validating
    * creating-order
    * checkout
    * booking
    */
    const [paymentStage, setPaymentStage] = useState("idle")

    const [paymentMethod, setPaymentMethod] = useState("UPI")
    const [deviceType, setDeviceType] = useState('desktop')
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)
    const maxRetries = 3

    /*
    * Prevent the same Razorpay order from being opened more than once
    * if the component happens to re-render.
    */
    const openedOrderIdRef = useRef(null)

    /*
    * Keep the payment ID available for failure/support messages
    * after Razorpay completes.
    */
    const paymentIdRef = useRef(null)

    const bookingStartedRef = useRef(false)

    const [feePerTicket] = useState(
        () => Math.floor(Math.random() * (20 - 15 + 1)) + 15
    ) 

    const ticketAmount = useMemo(
        () => show.ticketPrice * seats.length, 
        [show.ticketPrice, seats.length]
    )

    const baseAmount = useMemo(
        () => feePerTicket * seats.length, 
        [feePerTicket, seats.length]
    )

    const gst = useMemo(
        () => baseAmount * 0.18, 
        [baseAmount]
    )

    const convenienceFee = useMemo(
        () => baseAmount + gst, 
        [baseAmount, gst]
    )

    const totalAmount = useMemo(
        () => ticketAmount +  convenienceFee, 
        [ticketAmount, convenienceFee]
    )

    /*
    * ============================================================
    * Responsive handling
    * ============================================================
    */
    useEffect(() => {
        const getDeviceType = (width) => {
            if (width < 640) return 'mobile'
            if (width < 1024) return 'tablet'
            return 'desktop'
        }

        const handleResize = () => {
            setDeviceType(
                getDeviceType(window.innerWidth)
            )
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

    const paymentInProgress = paymentStatus === "processing" || isPaymentProcessing

    /*
    * ============================================================
    * Load Razorpay SDK
    * ============================================================
    */

    const loadRazorpayScript = useCallback(() => {
        return new Promise((resolve) => {
            // Check if script already exists
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            /*
            * Prevent duplicate script tags if the user retries
            * while the previous script is still present.
            */
            const existingScript =
                document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            )
            if (existingScript) 
            {
                existingScript.addEventListener(
                    "load",
                    () => resolve(true),
                    { once: true }
                )

                existingScript.addEventListener(
                    "error",
                    () => resolve(false),
                    { once: true }
                )

                return
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.defer = true;

            script.onload = () => {
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

    /*
    * ============================================================
    * STEP 1
    * User clicks Pay -> start seat validation
    * ============================================================
    */

    const handleRazorPay = useCallback(async () => {
        if(isPaymentProcessing || paymentStatus === "processing")
        {
            notify("warning", "Payment is already in progress. Please wait...");
            return;
        }

        if (!show?._id || !seats?.length) 
        {
            notify("error","Invalid booking information. Please select your seats again.")
            return
        }

        setError(null)
        setRetryCount(0)
        setPaymentStatus("processing")
        setPaymentStage("validating")

        /*
        * Clear stale values from any previous payment attempt.
        */
        dispatch(clearValidationResult())
        dispatch(clearBookingData())

        bookingStartedRef.current = false
        paymentIdRef.current = null
        openedOrderIdRef.current = null
        dispatch(validateSeatBookingRequest({ showId: show._id, seats }))

    }, [isPaymentProcessing, paymentStatus, show?._id, seats, dispatch])

    /*
    * ============================================================
    * STEP 2
    * React to seat-validation SUCCESS
    * ============================================================
    */
    useEffect(() => {
        if (paymentStage !== "validating") 
        {
            return
        }

        if (!validationResult) {
            return
        }

        if (!validationResult.success) 
        {
            setError(validationResult.message || "Selected seats are no longer available.")
            setPaymentStatus("failed")
            setPaymentStage("idle")
            return
        }

        /*
        * Important:
        * We are no longer reading razorpayOrder immediately
        * after dispatch.
        *
        * The next useEffect waits for Redux to actually receive it.
        */
        setPaymentStage("creating-order")

        dispatch(createRazorpayOrderRequest({
            showId: show._id,
            seats,
            feePerTicket,
        }))

        /*
        * Prevent this same validation result from being
        * reused later.
        */
        dispatch(clearValidationResult())
    }, [paymentStage, validationResult, show._id, seats, feePerTicket, dispatch])

    /*
    * ============================================================
    * STEP 2 failure
    *
    * Validation failures in bookingSlice use the generic
    * booking error field.
    * ============================================================
    */

    useEffect(() => {
        if (paymentStage !== "validating") 
        {
            return
        }

        if (!bookingError) {
            return
        }

        setError(bookingError || "Unable to validate the selected seats.")
        setPaymentStatus("failed")
        setPaymentStage("idle")
    }, [paymentStage, bookingError])

    /*
    * ============================================================
    * STEP 3 failure
    * Payment order creation failed
    * ============================================================
    */

    useEffect(() => {
        if (paymentStage !== "creating-order") 
        {
            return
        }

        if (!paymentError) {
            return
        }

        setError(paymentError || "Failed to create payment order.")
        setPaymentStatus("failed")
        setPaymentStage("idle")
    }, [paymentStage, paymentError])

    /*
    * ============================================================
    * STEP 3
    * Razorpay order actually arrived in Redux -> open Checkout
    * ============================================================
    */

    useEffect(() => {
        if (paymentStage !== "creating-order") 
        {
            return
        }

        if (!razorpayOrder?.id) 
        {
            return
        }

        /*
        * Protect against accidentally opening the same
        * Razorpay order twice.
        */
        if (openedOrderIdRef.current === razorpayOrder.id) 
        {
            return
        }

        openedOrderIdRef.current = razorpayOrder.id

        let cancelled = false

        const openRazorpayCheckout =
            async () => {
                const loaded = await loadRazorpayScript()

                if (cancelled) {
                    return
                }

                if (!loaded || !window.Razorpay) 
                {
                    setError("Unable to initialize Razorpay. Please try again.")
                    setPaymentStatus("failed")
                    setPaymentStage("idle")
                    return
                }

                setPaymentStage("checkout")

                const options = {
                    key: razorpayKey,
                    /*
                    * Razorpay order amount comes directly from
                    * the newly-created Redux order.
                    */
                    amount: razorpayOrder.amount,
                    currency: "INR",
                    name: "BookMyShow",
                    description: `Movie Ticket Booking - ${show.movie.movieName}`,
                    order_id: razorpayOrder.id,

                    /*
                    * ====================================================
                    * STEP 4
                    * Razorpay payment succeeded
                    * ====================================================
                    */
                    handler: (response) => {
                        paymentIdRef.current = response.razorpay_payment_id
                        bookingStartedRef.current = true

                        const bookingPayload = {
                            show: show._id,
                            user: user.id,
                            seats,
                            transactionId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            receipt: razorpayOrder.receipt,
                            amount: razorpayOrder.amount,
                            feePerTicket,
                            convenienceFee: razorpayOrder.convenienceFee ?? convenienceFee,
                            signature:
                            response.razorpay_signature,
                        }

                        /*
                        * Clear any old booking result before the
                        * new booking begins.
                        */
                        dispatch(clearBookingData())
                        setPaymentStage("booking")
                        dispatch(bookSeatsRequest(bookingPayload))
                    },

                    modal: { 
                        ondismiss: () => {
                            /*
                            * Only treat this as cancellation if
                            * booking confirmation has not already
                            * started.
                            */
                            if (!bookingStartedRef.current)
                            {
                                setPaymentStatus("")
                                setPaymentStage("idle")
                                notify("info", "Payment cancelled")
                            }
                        },
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
                        seats: seats.join(","),
                    },
                }

                const paymentObject = new window.Razorpay(options)
                paymentObject.open()
            }

            openRazorpayCheckout()

            return () => { cancelled = true }
        }, [
            paymentStage,
            razorpayOrder,
            loadRazorpayScript,
            show._id,
            show.movie.movieName,
            user,
            seats,
            feePerTicket,
            convenienceFee,
            dispatch,
    ])

    /*
    * ============================================================
    * STEP 5
    * Backend verified Razorpay signature and booking succeeded
    * ============================================================
    */

    useEffect(() => {
        if (paymentStage !== "booking") 
        {
            return
        }

        if (!bookingData) {
            return
        }

        setPaymentStatus("success")
        // setPaymentStage("idle")

        /*
        * bookSeatsSaga already sends the success notification,
        * therefore we do not send another duplicate toast here.
        */

        const timer = setTimeout(() => {
            navigate("/my-profile/purchase-history")
        }, 1500)

        return () => {
            clearTimeout(timer)
        }
    }, [
        paymentStage,
        bookingData,
        navigate,
    ])

    /*
    * ============================================================
    * STEP 5 failure
    * Payment succeeded but backend booking/signature verification
    * failed.
    * ============================================================
    */

    useEffect(() => {
        if (paymentStage !== "booking") {
            return
        }

        if (!bookingError) {
            return
        }

        const paymentReference =paymentIdRef.current

        const message =
            paymentReference
                ? `Booking failed after payment. Please contact support with your payment ID: ${paymentReference}`
                : "Booking could not be confirmed. Please contact support."

        setError(message)
        setPaymentStatus("failed")
        setPaymentStage("idle")
    }, [
        paymentStage,
        bookingError,
    ])

    /*
    * ============================================================
    * UI Helpers
    * ============================================================
    */

    const renderPaymentStatus = useCallback(() => {
        if (paymentStatus === "processing") 
        {
            let processingMessage = "Initializing payment...";

            if (paymentStage === "validating") 
            {
                processingMessage = "Validating selected seats...";
            } 
            else if (paymentStage === "creating-order") 
            {
                processingMessage = "Creating secure payment order...";
            } 
            else if (paymentStage === "checkout") 
            {
                processingMessage = "Complete the payment in the Razorpay window...";
            } 
            else if (paymentStage === "booking") 
            {
                processingMessage = "Payment received. Confirming your booking...";
            }
            return (
                <div className='text-center py-6'>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 32}} spin />} />
                    <div className='mt-3 text-gray-600 text-base'>{ processingMessage }</div>
                    <div className="mt-1 text-gray-500 text-sm">Please do not refresh or close this page.</div>
                </div>
            )
        }

        if(paymentStatus === "success")
        {
            return (
                <div className='text-center py-6'>
                    <CheckCircleOutlined style={{fontSize: 32, color: '#52c41a'}} />
                    <div className='mt-3 text-green-600 text-base font-medium'>
                         Booking Confirmed!
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
                        Payment / Booking Failed
                    </div>
                    <div className='mt-2 text-gray-500 text-sm'>Please review the error and try again or contact support if the issue persists.</div>
                </div>
            );
        }

        return null;
    }, [paymentStatus,  paymentStage])

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
                    retryCount < maxRetries &&  paymentStage === "idle" && 
                    (
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
    }, [error, retryCount, paymentStage, handleRazorPay]);

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
                            {formatDate(show?.date, "EEE, dd MMM, yyyy")} | {" "}
                            {formatParsedTime(show?.time)}
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
                                disabled={method.disabled || paymentInProgress}
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
                    disabled={paymentInProgress}
                    className={`${isMobile ? "order-2" : ""} min-h-12! w-full! ${isMobile ? "w-full!" : "w-auto!"}`}
                    aria-label="Go back to seat selection"
                >
                    Back
                </Button>
                <Button 
                    type="primary"
                    size="large" 
                    loading={paymentInProgress}
                    disabled={paymentInProgress}
                    onClick= {handleRazorPay}
                    className={`bg-[#f84464]! hover:bg-[#dc3558]! ${isMobile ? "order-1" : ""} min-h-12! ${
                        isMobile ? "text-base! font-semibold! w-full!" : "w-auto!"
                    }`}
                    aria-label={`Pay ₹${totalAmount.toFixed(2)} using ${paymentMethod}`}
                >
                    {paymentInProgress ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>
            </div>

            {/* Mobile Sticky Footer */}
            {isMobile && !paymentInProgress && (
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
                            loading={paymentInProgress}
                            disabled={paymentInProgress}
                            onClick={handleRazorPay}
                            className="bg-[#f84464]! hover:bg-[#dc3558]! w-full min-h-12! text-base! font-semibold!"
                            aria-label={`Pay ₹${totalAmount.toFixed(2)} using ${paymentMethod}`}
                        >
                            {paymentInProgress ? "Processing..." : `Pay Now ₹${totalAmount.toFixed(2)}`}
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

import React, { useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { Alert, Button, Card, Divider, Spin, Typography } from 'antd'
import { 
    ArrowLeftOutlined,
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    CreditCardOutlined,
    InfoCircleOutlined, 
    LoadingOutlined, 
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
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
import { getScreenDisplayName } from '../../../utils/screenDisplay';
import {
    buildSelectedSeatPricing,
    formatCurrency,
} from '../../../utils/ticketPricing';
import BookingSummaryCard from '../../../components/booking/BookingSummaryCard';
const { Title ,Text, Paragraph } = Typography;

const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

const PaymentSummary = React.memo(({show, seats, showSeats = [], handlePreviousStep}) => {
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

    const selectedSeatPricing = useMemo(
        () => buildSelectedSeatPricing(show, showSeats, seats),
        [show, showSeats, seats]
    )

    const ticketAmount = selectedSeatPricing.ticketAmount

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

    const paymentInProgress = paymentStatus === "processing" || isPaymentProcessing
    const screenDisplayName = getScreenDisplayName(show?.screen)
    const formattedShowDate = formatDate(show?.date, "EEE, dd MMM, yyyy")
    const formattedShowTime = formatParsedTime(show?.time)
    const feeBreakdown = useMemo(() => [
        { label: "Base Convenience Fee", amount: baseAmount },
        { label: "GST @18%", amount: gst },
    ], [baseAmount, gst])

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

        const confirmedBookingId = bookingData?.bookingId || bookingData?._id

        if (!confirmedBookingId)
        {
            navigate("/my-profile/purchase-history")
            return
        }

        navigate(`/booking-confirmation/${confirmedBookingId}`, {
            state: {
                booking: bookingData,
                bookingContext: {
                    show,
                    seats,
                    seatPricing: selectedSeatPricing.seatPricing,
                    ticketAmount,
                    convenienceFee,
                    totalAmount,
                    feeBreakdown,
                    screenDisplayName,
                    formattedShowDate,
                    formattedShowTime,
                },
            },
        })
    }, [
        paymentStage,
        bookingData,
        show,
        seats,
        selectedSeatPricing.seatPricing,
        ticketAmount,
        convenienceFee,
        totalAmount,
        feeBreakdown,
        screenDisplayName,
        formattedShowDate,
        formattedShowTime,
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
                <div className="checkout-status-inline" aria-live="polite">
                    <Spin indicator={<LoadingOutlined style={{fontSize: 20}} spin />} />
                    <div>
                        <Text strong>{ processingMessage }</Text>
                        <Text type="secondary">Please do not refresh or close this page.</Text>
                    </div>
                </div>
            )
        }

        if(paymentStatus === "success")
        {
            return (
                <div className="checkout-status-inline success" aria-live="polite">
                    <CheckCircleOutlined />
                    <div>
                        <Text strong>Booking Confirmed!</Text>
                        <Text type="secondary">Opening your booking confirmation.</Text>
                    </div>
                </div>
            )
        }

        if (paymentStatus === "failed") {
            return (
                <div className="checkout-status-inline failed" aria-live="polite">
                    <CloseCircleOutlined />
                    <div>
                        <Text strong>Payment / Booking Failed</Text>
                        <Text type="secondary">Please review the error and try again or contact support if the issue persists.</Text>
                    </div>
                </div>
            );
        }

        return null;
    }, [paymentStatus,  paymentStage])

    const renderErrorAlert = useCallback(() => {
        if (!error) return null;

        return (
            <Alert
                title="Error"
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

    return (
        <div 
            className={`checkout-experience ${isMobile ? "mobile-payment" : ""}`}
            role="main"
            aria-label="Checkout"
        >
            <section className="checkout-main-column">
                <Card className="checkout-flow-card" variant="borderless">
                  <div className="checkout-heading">
                    <Title level={3}>Complete Your Booking</Title>
                    <Text type="secondary">Review your details and continue to Razorpay secure checkout.</Text>
                  </div>

                  <section className="checkout-flow-section">
                    <div className="checkout-section-heading">
                        <Title level={4}>Contact Details</Title>
                        <Text type="secondary">Used only to prefill the Razorpay checkout window.</Text>
                    </div>
                    <div className="checkout-contact-grid">
                        <div>
                            <UserOutlined aria-hidden="true" />
                            <span>
                                <Text type="secondary">Name</Text>
                                <Text strong>{user?.name || "Not provided"}</Text>
                            </span>
                        </div>
                        <div>
                            <MailOutlined aria-hidden="true" />
                            <span>
                                <Text type="secondary">Email</Text>
                                <Text strong>{user?.email || "Not provided"}</Text>
                            </span>
                        </div>
                        <div>
                            <PhoneOutlined aria-hidden="true" />
                            <span>
                                <Text type="secondary">Phone</Text>
                                <Text strong>{user?.phone || "Not provided"}</Text>
                            </span>
                        </div>
                    </div>
                  </section>

                  <Divider />

                  <section className="checkout-flow-section">
                    <div className="checkout-payment-method">
                        <div className="checkout-payment-icon">
                            <CreditCardOutlined aria-hidden="true" />
                        </div>
                        <div>
                            <Title level={4}>Payment Method</Title>
                            <Text strong>Razorpay Secure Checkout</Text>
                            <Paragraph type="secondary">
                                Pay securely using UPI, cards, wallets and other supported methods in Razorpay.
                            </Paragraph>
                        </div>
                    </div>
                    {(paymentStatus === "processing" || paymentStatus === "success" || paymentStatus === "failed") && (
                        <div className="checkout-status-region">
                            {renderPaymentStatus()}
                        </div>
                    )}
                    {renderErrorAlert()}
                    <Divider />
                    <div className="checkout-trust-row">
                        <SafetyCertificateOutlined aria-hidden="true" />
                        <Text type="secondary">Secure payment powered by Razorpay.</Text>
                    </div>
                  </section>

                  <div className="checkout-policy-note">
                    <InfoCircleOutlined aria-hidden="true" />
                    <Paragraph type="secondary">
                        By proceeding, you agree to our{" "}
                        <a href="#" aria-label="Read Terms and Conditions">Terms & Conditions</a>{" "}
                        and{" "}
                        <a href="#" aria-label="Read Cancellation Policy">Cancellation Policy</a>.
                        A ticket confirmation will be sent to your registered email when delivery succeeds.
                    </Paragraph>
                  </div>

                  <Button
                    size="large"
                    onClick={handlePreviousStep}
                    disabled={paymentInProgress}
                    className="checkout-edit-seats"
                    aria-label="Edit selected seats"
                    icon={<ArrowLeftOutlined aria-hidden="true" />}
                >
                    Edit Seats
                  </Button>
                </Card>
            </section>

            <aside className="checkout-summary-column">
                <BookingSummaryCard
                    show={show}
                    screenName={screenDisplayName}
                    formattedDate={formattedShowDate}
                    formattedTime={formattedShowTime}
                    selectedSeats={seats}
                    seatPricing={selectedSeatPricing.seatPricing}
                    ticketAmount={ticketAmount}
                    convenienceFee={convenienceFee}
                    totalAmount={totalAmount}
                    feeBreakdown={feeBreakdown}
                    ctaLabel={paymentInProgress ? "Processing..." : `Pay ${formatCurrency(totalAmount)}`}
                    ctaAriaLabel={`Pay ${formatCurrency(totalAmount)} with Razorpay`}
                    ctaDisabled={paymentInProgress}
                    ctaLoading={paymentInProgress}
                    onCtaClick={handleRazorPay}
                />
            </aside>
        </div>
    )
});

export default PaymentSummary

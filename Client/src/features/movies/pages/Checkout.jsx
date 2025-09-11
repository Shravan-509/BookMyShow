import { useMemo, useState } from 'react';
import { Button, Collapse, Divider, Space, Spin, Typography } from 'antd'
import { DownCircleOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { bookSeat, createPaymentIntent, createRazorPayOrder } from '../../../api/booking';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../../utils/notificationUtils';
const { Title ,Text, Paragraph } = Typography;
const { Panel } = Collapse; 

const PaymentSummary = ({show, seats, handlePreviousStep}) => {
    const {user} = useAuth(); 
    const navigate = useNavigate();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState("") // 'processing', 'success', 'failed'

    const [feePerTicket] = useState(Math.floor(Math.random() * (20 - 15 + 1)) + 15);
    const ticketAmount = useMemo(() => show.ticketPrice * seats.length, [show, seats]);
    const baseAmount = useMemo(() => feePerTicket * seats.length, [feePerTicket, seats]);
    const gst = useMemo(() => baseAmount * 0.18, [baseAmount]);
    const convenienceFee = useMemo(() => baseAmount + gst, [baseAmount, gst]);
    const totalAmount = useMemo(() => ticketAmount +  convenienceFee, [ticketAmount, convenienceFee]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const validateSeatAvailability = async () => {
    try {
      // This would ideally call a backend API to check real-time seat availability
      // For now, we'll add a client-side check as a first line of defense
      console.log("[v0] Validating seat availability for:", seats)

      // TODO: Replace with actual API call to validate seats
      // const response = await validateSeats({ showId: show._id, seats });
      // return response.success;

      return true // Placeholder - should be replaced with actual validation
    } catch (error) {
      console.error("[v0] Seat validation error:", error)
      return false
    }
  }

    const handleRazorPay = async () => {
        if(isProcessingPayment)
        {
            notify("warning", "Payment is already in progress. Please wait...");
            return;
        }

        try {
            setIsProcessingPayment(true);
            setPaymentStatus("processing");

            const seatsAvailable = await validateSeatAvailability();

            if(!seatsAvailable)
            {
                notify("error", "Selected seats are no longer available. Please select different seats.");
                setIsProcessingPayment(false);
                setPaymentStatus("failed");
                return;
            }

            const amount = parseFloat(totalAmount.toFixed(2));
            const response = await createRazorPayOrder({amount})

            if(response.success)
            {
                const order_id = response.data?.id;
                const order_amount = response.data?.amount;
                const order_receipt = response.data?.receipt;

                const res = await loadRazorpayScript();
                
                if (!res) 
                {
                    notify("warning", "Razorpay SDK failed to load. Are you online?");
                    setIsProcessingPayment(false);
                    setPaymentStatus("failed");
                    return;
                }

                const options = {
                    key: "rzp_test_UQZ8B4sElVIiYY", // Razorpay key
                    amount: order_amount,
                    currency: "INR",
                    name: "BookMyShow",
                    description: "Movie Ticket Booking",
                    order_id,
                    handler: async function (response) {
                        console.log("Payment Successful, processing booking...")
                        setPaymentStatus("success");

                        try 
                        {
                            // Send these to backend to verify & book
                            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                            const resp = await bookSeat({
                                show: show._id,
                                user: user._id,
                                seats,
                                transactionId: razorpay_payment_id,
                                orderId: razorpay_order_id,
                                receipt: order_receipt,
                                amount: order_amount,
                                convenienceFee : convenienceFee,
                                signature: razorpay_signature                                  
                            });
                            if(resp.success)
                            {
                                notify("success", resp.message);
                                console.log("Booking confirmed, navigating to history...")

                                setTimeout(()=> {
                                    navigate("/my-profile/purchase-history");
                                }, 1500)                            
                            }
                            else
                            {
                                notify("error", "Booking failed: " + resp.message);
                                setPaymentStatus("failed");
                            }
                        } 
                        catch (bookingError) 
                        {
                            console.log("Booking error: ", bookingError);
                            notify("error", "Booking failed, Please contact support with your payment ID: " + response.razorpay_payment_id);
                            setPaymentStatus("failed");
                        }
                        finally{
                            setIsProcessingPayment(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            console.log("Payment modal dismissed");
                            setIsProcessingPayment(false);
                            setPaymentStatus("");
                            notify("info", "Payment cancelled");
                        }
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                        contact: user?.phone,
                    },
                    theme: {
                        color: "#F37254",
                    },
                };
                const paymentObject = new window.Razorpay(options);
                paymentObject.open();
            }
            else
            {
                notify("warning", response.message);
                setIsProcessingPayment(false);
                setPaymentStatus("failed");
            }
        } 
        catch (error) 
        {
            console.log("Payment error: ", error);
            notify("error", error.message);
            setIsProcessingPayment(false);
            setPaymentStatus("failed");
        }
    }

    const renderPaymentStatus = () => {
        if(paymentStatus === "processing")
        {
            return (
                <div className='text-center py-4'>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 24}} spin />} />
                    <div className='"mt-2 text-gray-600'>Initializing payment...</div>
                </div>
            )
        }

        if(paymentStatus === "success")
        {
            return (
                <div className='text-center py-4'>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 24}} spin />} />
                    <div className='"mt-2 text-green-600'>Payement Successful! Confirming your booking...</div>
                    <div className='"mt-2 text-gray-500 mt-1'>You will be redirected to your booking history shortly.</div>
                </div>
            )
        }
        return null;
    }

    return (
        <div>
            <Title level={4} className="!mb-6">
                Payment Summary
            </Title>
            {
                (paymentStatus === "processing" || paymentStatus === "success") && (
                    <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                        {renderPaymentStatus()}
                    </div>
                )
            }
            <div>
                <div className='mb-6'>
                    <Title level={5} className='!mb-2'>
                        {show.movie.movieName}
                    </Title>
                    <Space direction="vertical" size={4} className="!mb-2">
                        <Text type="secondary">{show.theatre.name}</Text>
                        <Text type="secondary">
                            Seats - {seats.join(', ')} ( {seats.length} Tickets )
                        </Text>
                        <Text type="secondary">
                        {moment(show.date).format("ddd, DD MMM, YYYY")} | {moment(show.time, "HH:mm").format("hh:mm A")}
                        </Text>
                    </Space>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                        <Text className="!text-base !text-gray-800">
                            Ticket Price ({seats.length} × ₹{show.ticketPrice})
                        </Text>
                        <Text className="!text-base !font-medium !text-gray-900">₹{ticketAmount.toFixed(2)}</Text>
                    </div>

                    <Collapse bordered={false}
                        ghost 
                        expandIconPosition="start" 
                        className="custom-collapse !bg-transparent"
                        expandIcon={({ isActive }) => <DownCircleOutlined rotate={isActive ? -180 : 0} />}
                    >
                        <Panel
                            header={
                                <div className="flex justify-between w-full">
                                    <Text className="!text-base !text-gray-800">
                                        Convenience Fee
                                        </Text>
                                    <Text className="!text-base !font-medium !text-gray-900">
                                        ₹{(convenienceFee).toFixed(2)}
                                    </Text>
                                </div>
                            }
                            key="1"
                        >
                            <div className="space-y-2 px-1 pt-1">
                                <div className="!flex !justify-between">
                                    <Text type='secondary'>Base Amount</Text>
                                    <Text type='secondary'>₹{baseAmount.toFixed(2)}</Text>
                                </div>
                                <div className="!flex !justify-between">
                                    <Text type='secondary'>Integrated GST (IGST) @18%</Text>
                                    <Text type='secondary'>₹{gst.toFixed(2)}</Text>
                                </div>
                            </div>
                        </Panel>
                    </Collapse>
                </div>

                <Divider/>

                <div className='flex justify-between'>
                    <div>
                        <Title level={5} className='!mb-1'>
                            Amount Payable
                        </Title>
                    </div>
                
                    <div>
                        <Title level={5} className='!mb-1'>
                            ₹{totalAmount.toFixed(2)}
                        </Title>
                    </div>
                </div>
            </div>

            <Divider/>

            {/* <div className='mb-6'>
                <Title level={5} className='!mb-4'>Select Payment Method</Title>
                <Radio.Group 
                    value={paymentMethod} 
                    className='!w-full'
                    onChange={(e) => setPaymenMethod(e.target.value)}
                
                >
                    <div className='grid xl:grid-cols-2 md:grid-cols-1 gap-4'>
                        <Radio value={"card"} className='!border !p-4 !rounded-xl'>
                            <div>
                                <Text strong className='!block !mb-1'>Credit/Debit Card</Text>
                                <Text type={"secondary"} className='!text-sm'>Pay securely with your card</Text>
                            </div>
                        </Radio>
                        <Radio value={"upi"} className='!border !p-4 !rounded-xl'>
                            <div>
                                <Text strong className='!block !mb-1'>UPI</Text>
                                <Text type={"secondary"} className='!text-sm'>Google Pay, PhonePe, Paytm & more</Text>
                            </div>
                        </Radio>
                        <Radio value={"netBanking"} className='!border !p-4 !rounded-xl'>
                            <div>
                                <Text strong className='!block !mb-1'>Net Banking</Text>
                                <Text type={"secondary"} className='!text-sm'>All major banks supported</Text>
                            </div>
                        </Radio>
                        <Radio value={"wallet"} className='!border !p-4 !rounded-xl'>
                            <div>
                                <Text strong className='!block !mb-1'>Wallet</Text>
                                <Text type={"secondary"} className='!text-sm'>Amazon Pay, Paytm & more</Text>
                            </div>
                        </Radio>
                    </div>
                </Radio.Group>
            </div> */}

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                    <ExclamationCircleOutlined className="!h-5 !w-5 !text-gray-500 !mr-2 !flex-shrink-0 !mt-0.5" />
                    <Paragraph type="secondary" className="!text-sm">
                        By proceeding, you agree to our{" "}
                        <a href="#" className="!text-blue-600">
                        Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a href="#" className="!text-blue-600">
                        Cancellation Policy
                        </a>
                        . A confirmation will be sent to your email and phone number.
                    </Paragraph>
                </div>
            </div>

            <div className="flex justify-between">
                <Button 
                    size="large" 
                    onClick={handlePreviousStep}
                    disabled={isProcessingPayment}
                >
                    Back
                </Button>
                <Button 
                    type="primary"
                    size="large" 
                    loading={isProcessingPayment}
                    disabled={isProcessingPayment}
                    onClick= {handleRazorPay}
                    className='!bg-[#f84464]'
                >
                    {isProcessingPayment ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>
            </div>
        </div>
    )
}

export default PaymentSummary
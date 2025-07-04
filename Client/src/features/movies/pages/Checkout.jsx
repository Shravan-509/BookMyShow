import React, { useMemo, useState } from 'react';
import { Button, Collapse, Divider, message, Modal, Radio, Space, Typography } from 'antd'
import { DownCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { bookSeat, createPaymentIntent, createRazorPayOrder } from '../../../api/booking';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
const { Title ,Text, Paragraph } = Typography;
const { Panel } = Collapse; 

const PaymentSummary = ({show, seats, handlePreviousStep}) => {
    const {user} = useAuth(); 
    const navigate = useNavigate();

    const [feePerTicket] = useState(Math.floor(Math.random() * (20 - 15 + 1)) + 15);
    const baseAmount = useMemo(() => show.ticketPrice * seats.length, [show, seats]);
    const convenienceFee = useMemo(() => feePerTicket * seats.length, [feePerTicket, seats]);
    const gst = useMemo(() => convenienceFee * 0.18, [convenienceFee]);
    const totalAmount = useMemo(() => baseAmount + convenienceFee + gst , [baseAmount, convenienceFee, gst]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleRazorPay = async () => {
        try {
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
                    message.warning("Razorpay SDK failed to load. Are you online?");
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
                            navigate("/my-profile/purchase-history");
                            message.success(resp.message);
                           
                        }
                        else
                        {
                            message.warning(resp.message);
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
                message.warning(response.message);
            }
            
        } catch (error) {
            message.error(error.message);
        }
    }
  return (
    <div>
        <Title level={4} className="!mb-6">
            Payment Summary
        </Title>
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
                    <Text className="!text-base !font-medium !text-gray-900">₹{baseAmount.toFixed(2)}</Text>
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
                                    ₹{(convenienceFee + gst).toFixed(2)}
                                </Text>
                            </div>
                        }
                        key="1"
                    >
                        <div className="space-y-2 px-1 pt-1">
                            <div className="!flex !justify-between">
                                <Text type='secondary'>Base Amount</Text>
                                <Text type='secondary'>₹{convenienceFee.toFixed(2)}</Text>
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
            <Button size="large" onClick={handlePreviousStep}>Back</Button>
            <Button 
                type="primary"
                size="large" 
                
                onClick= {handleRazorPay}
                className='!bg-[#f84464]'>
                Pay ₹{totalAmount.toFixed(2)}
            </Button>
        </div>
    </div>
  )
}

export default PaymentSummary
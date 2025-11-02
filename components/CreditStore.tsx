import React, { useState, useRef, useEffect } from 'react';
import { CreditCardIcon, LogoIcon, CheckCircleIcon } from './icons';
import { CreditPackage, User } from '../types';

// Make QRCode globally available
declare const QRCode: any;

const packages: CreditPackage[] = [
    { id: 'starter', name: 'Starter Pack', credits: 100, price: 5 },
    { id: 'creator', name: 'Creator Pack', credits: 500, price: 20, tag: 'Best Value' },
    { id: 'pro', name: 'Studio Pro', credits: 2000, price: 75, tag: 'Most Popular' },
];

interface CreditStoreProps {
    onNavigate: (view: 'studio') => void;
    user: User | null;
}

const CreditStore: React.FC<CreditStoreProps> = ({ onNavigate, user }) => {
    const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedPackage && qrCodeRef.current && user) {
            qrCodeRef.current.innerHTML = '';
            const cashAppUrl = `https://cash.app/$edcmediadesigns/${selectedPackage.price}`;
            QRCode.toCanvas(cashAppUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#FFFFFF',
                    light: '#00000000'
                }
            }, (err: Error, canvas: HTMLCanvasElement) => {
                if (err) console.error(err);
                if (canvas) qrCodeRef.current?.appendChild(canvas);
            });
        }
    }, [selectedPackage, user]);

    const handleSelectPackage = (pkg: CreditPackage) => {
        setSelectedPackage(pkg);
    };

    return (
        <div className="futuristic-bg min-h-screen text-white p-8">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center space-x-3">
                    <LogoIcon className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-3xl font-bold text-shadow-cyan">Credit Store</h1>
                </div>
                <button onClick={() => onNavigate('studio')} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40 transition">
                    Back to Studio
                </button>
            </header>

            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-extrabold">Never Run Out of Creative Fuel</h2>
                <p className="mt-4 text-lg text-gray-400">
                    Choose a package that fits your needs. More credits mean more conversations and endless podcast possibilities.
                </p>
            </div>
            
            <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {packages.map(pkg => (
                    <div key={pkg.id} className={`relative bg-black/20 p-8 rounded-lg border-2 transition-all duration-300 ${pkg.id === 'pro' ? 'border-cyan-500' : 'border-cyan-500/20'} hover:border-cyan-500 hover:shadow-[0_0_25px_rgba(0,255,255,0.15)] hover:-translate-y-2`}>
                        {pkg.tag && (
                             <div className={`absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-bold rounded-full ${pkg.tag === 'Most Popular' ? 'bg-cyan-500 text-black' : 'bg-indigo-500 text-white'}`}>
                                {pkg.tag}
                            </div>
                        )}
                        <h3 className="text-2xl font-bold text-center text-cyan-300">{pkg.name}</h3>
                        <p className="text-center text-5xl font-extrabold my-6">{pkg.credits.toLocaleString()}</p>
                        <p className="text-center text-gray-400 mb-8">Generation Credits</p>
                        <button 
                            onClick={() => handleSelectPackage(pkg)}
                            className={`w-full py-3 font-semibold rounded-lg transition ${pkg.id === 'pro' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_theme(colors.cyan.500)]' : 'bg-white/10 hover:bg-white/20'}`}>
                            ${pkg.price}
                        </button>
                    </div>
                ))}
            </div>

            {selectedPackage && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={() => setSelectedPackage(null)}>
                    <div className="bg-black/40 border border-cyan-500/50 rounded-xl shadow-2xl shadow-cyan-500/20 p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-center text-cyan-300">Complete Your Purchase</h2>
                        <div className="flex flex-col items-center mt-6">
                            <p className="text-gray-300">Scan the QR code with your Cash App to pay:</p>
                            <div ref={qrCodeRef} className="mt-4 p-2 bg-white rounded-lg"></div>
                            <p className="mt-4 font-mono text-lg text-cyan-400">$edcmediadesigns</p>
                            <div className="mt-6 text-center bg-cyan-900/50 border border-cyan-500/30 p-4 rounded-lg">
                                <p className="font-bold text-cyan-300">IMPORTANT:</p>
                                <p className="text-sm text-gray-300">
                                    Please include the following in the payment note so we can credit your account:
                                </p>
                                <p className="mt-2 font-mono bg-black/50 px-2 py-1 rounded text-cyan-400">{user.email}</p>
                                <p className="mt-3 text-xs text-gray-400">
                                    Your credits will be manually added by an admin within 24 hours of payment confirmation.
                                </p>
                            </div>

                             <button 
                                onClick={() => setSelectedPackage(null)}
                                className="mt-6 flex items-center justify-center space-x-2 w-full py-3 bg-cyan-600 font-semibold rounded-lg hover:bg-cyan-500 transition shadow-[0_0_15px_theme(colors.cyan.500)]"
                            >
                                <CheckCircleIcon className="w-5 h-5"/>
                                <span>Done</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditStore;

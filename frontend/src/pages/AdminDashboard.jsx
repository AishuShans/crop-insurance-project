import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [allClaims, setAllClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetchAllClaims();
    }, []);

    const fetchAllClaims = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/admin/claims`);
            if (response.data && response.data.length > 0) {
                setAllClaims(response.data);
            } else {
                const demoRecords = [
                    { id: 1, claim_id: 'CLM001', farmer_name: 'Ravi', status: 'Pending', crop_type: 'Wheat', event_type: 'Flood', ml_prediction: 'Review' },
                    { id: 2, claim_id: 'CLM002', farmer_name: 'Kumar', status: 'Verified', crop_type: 'Rice', event_type: 'Drought', ml_prediction: 'Accept' },
                    { id: 3, claim_id: 'CLM003', farmer_name: 'Mani', status: 'Approved', crop_type: 'Corn', event_type: 'Pest', ml_prediction: 'Accept' },
                    { id: 4, claim_id: 'CLM004', farmer_name: 'Suresh', status: 'Rejected', crop_type: 'Soybean', event_type: 'Flood', ml_prediction: 'Reject' },
                    { id: 5, claim_id: 'CLM005', farmer_name: 'Devi', status: 'Pending', crop_type: 'Cotton', event_type: 'Drought', ml_prediction: 'Review' },
                    { id: 6, claim_id: 'CLM006', farmer_name: 'Arun', status: 'Approved', crop_type: 'Wheat', event_type: 'Frost', ml_prediction: 'Accept' }
                ];
                setAllClaims(demoRecords);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const displayedClaims = useMemo(() => {
        let filtered = [];
        if (filterStatus === 'All') {
            filtered = allClaims;
        } else {
            filtered = allClaims.filter(claim => {
                const claimStatus = claim.status || '';
                return claimStatus.toLowerCase().trim() === filterStatus.toLowerCase().trim();
            });
        }
        return filtered;
    }, [allClaims, filterStatus]);

    const handleUpdateStatus = async (status) => {
        try {
            await axios.put(`http://localhost:8000/api/admin/claims/${selectedClaim.claim_id}`, {
                status: status,
                admin_notes: adminNote
            });
            setSelectedClaim(null);
            setAdminNote('');
            fetchAllClaims();
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    const generateMockNDVIData = (damagePct) => {
        const data = [];
        const baseNDVI = 0.75 + (Math.random() * 0.1); 
        const drop = (damagePct / 100) * baseNDVI;
        
        for (let i = 1; i <= 10; i++) {
            if (i < 5) {
                data.push({ day: `Day ${i}`, ndvi: parseFloat((baseNDVI + (Math.random() * 0.05 - 0.025)).toFixed(3)) });
            } else if (i === 5) {
                data.push({ day: `Event`, ndvi: parseFloat((baseNDVI - (drop * 0.5)).toFixed(3)) });
            } else {
                data.push({ day: `Day ${i}`, ndvi: parseFloat((baseNDVI - drop + (Math.random() * 0.05 - 0.025)).toFixed(3)) });
            }
        }
        return data;
    };

    const ndviData = useMemo(() => {
        if (!selectedClaim) return [];
        return generateMockNDVIData(selectedClaim.damage_percentage || 0);
    }, [selectedClaim]);

    const getTranslatedStatus = (status) => {
        const key = status.toLowerCase();
        return t(`status.states.${key}`);
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-4xl font-extrabold mb-8 text-gradient text-center">{t('admin.title')}</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Queue Section */}
                <div className="md:col-span-1 glass p-4 rounded-2xl border-t-4 border-emerald-500 h-[800px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="font-bold text-lg text-gray-800">{t('admin.queue_title')}</h2>
                        <select
                            className="p-1 border rounded text-sm bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">{t('admin.filters.all')}</option>
                            <option value="Pending">{t('admin.filters.pending')}</option>
                            <option value="Verified">{t('admin.filters.verified')}</option>
                            <option value="Approved">{t('admin.filters.approved')}</option>
                            <option value="Rejected">{t('admin.filters.rejected')}</option>
                        </select>
                    </div>

                    <div className="bg-gray-100 p-3 rounded-lg mb-4 text-xs font-mono text-gray-700 shadow-inner">
                        <p className="font-bold border-b border-gray-300 mb-1 pb-1">{t('admin.debug.panel')}</p>
                        <div className="grid grid-cols-2 gap-1">
                            <p>{t('admin.debug.total')}:</p><p className="font-bold">{allClaims.length}</p>
                            <p>{t('admin.debug.selected')}:</p><p className="font-bold">{filterStatus}</p>
                            <p>{t('admin.debug.filtered')}:</p><p className="font-bold">{displayedClaims.length}</p>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-grow space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                                <p className="text-gray-500 font-medium">{t('admin.fetching')}</p>
                            </div>
                        ) : displayedClaims.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">{t('admin.no_claims')}</p>
                        ) : (
                            displayedClaims.map(claim => (
                                <div
                                    key={claim.id}
                                    onClick={() => setSelectedClaim(claim)}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 shadow-sm ${selectedClaim?.id === claim.id ? 'border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]' : 'hover:bg-white border-gray-200'}`}
                                >
                                    <div className="flex justify-between">
                                        <span className="font-bold text-sm text-gray-800">{claim.claim_id}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                            claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {getTranslatedStatus(claim.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mt-1">{claim.farmer_name} - {claim.crop_type}</p>
                                    <p className="text-xs text-gray-500 mt-1">{claim.event_type} • ML: <span className={claim.ml_prediction === 'Accept' ? 'text-green-600 font-bold' : claim.ml_prediction === 'Reject' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>{claim.ml_prediction}</span></p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Claim Details Section */}
                <div className="md:col-span-2">
                    {selectedClaim ? (
                        <div className="glass p-8 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{t('admin.reviewing')}: {selectedClaim.claim_id}</h2>
                                    <p className="text-gray-500">{t('admin.submitted')}: {selectedClaim.event_start_date} | {t('admin.farmer')}: <span className="font-semibold text-gray-700">{selectedClaim.farmer_name}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('admin.ml_prediction')}</p>
                                    <p className={`text-2xl font-black ${selectedClaim.ml_prediction === 'Accept' ? 'text-green-600' :
                                        selectedClaim.ml_prediction === 'Reject' ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                        {selectedClaim.ml_prediction}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div className="p-4 bg-white/50 backdrop-blur-md rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                    <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-1">{t('admin.crop_type')}</p>
                                    <p className="text-lg font-semibold text-gray-800 leading-tight">{selectedClaim.crop_type}</p>
                                </div>
                                <div className="p-4 bg-white/50 backdrop-blur-md rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                    <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-1">{t('admin.event_type')}</p>
                                    <p className="text-lg font-semibold text-gray-800 leading-tight">{selectedClaim.event_type}</p>
                                </div>
                                <div className="p-4 bg-red-50/80 backdrop-blur-md rounded-xl border border-red-200 shadow-sm flex flex-col justify-center">
                                    <p className="font-bold text-red-800 text-[10px] uppercase tracking-wider mb-1">{t('admin.est_damage')}</p>
                                    <p className="text-2xl font-black text-red-600 leading-tight">{selectedClaim.damage_percentage?.toFixed(1) || 0}%</p>
                                </div>
                                <div className="p-4 bg-white/50 backdrop-blur-md rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                                    <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-1">{t('admin.requested')}</p>
                                    <p className="text-xl font-bold text-gray-700 leading-tight">₹ {selectedClaim.requested_claim_amount?.toLocaleString('en-IN') || '0'}</p>
                                </div>
                                <div className="p-4 bg-emerald-50/80 backdrop-blur-md rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-center">
                                    <p className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">✨ {t('admin.suggested')}</p>
                                    <p className="text-2xl font-black text-emerald-600 leading-tight">₹ {selectedClaim.suggested_payout?.toLocaleString('en-IN') || '0'}</p>
                                </div>
                            </div>

                            {/* Weather & Intelligence Panel */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Fraud Detection */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">{t('admin.fraud.title')}</h3>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${selectedClaim.fraud_risk_level === 'High' ? 'border-red-500 bg-red-50' : selectedClaim.fraud_risk_level === 'Medium' ? 'border-yellow-500 bg-yellow-50' : 'border-emerald-500 bg-emerald-50'}`}>
                                            <span className={`text-2xl font-black ${selectedClaim.fraud_risk_level === 'High' ? 'text-red-600' : selectedClaim.fraud_risk_level === 'Medium' ? 'text-yellow-600' : 'text-emerald-600'}`}>{selectedClaim.fraud_score?.toFixed(0) || 0}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('admin.fraud.risk_level')}</p>
                                            <p className={`text-xl font-bold ${selectedClaim.fraud_risk_level === 'High' ? 'text-red-600' : selectedClaim.fraud_risk_level === 'Medium' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                                {selectedClaim.fraud_risk_level === 'High' ? t('admin.fraud.high') : selectedClaim.fraud_risk_level === 'Medium' ? t('admin.fraud.medium') : t('admin.fraud.low')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{t('admin.fraud.desc')}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Weather Timeline */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">{t('admin.weather.title')}</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 w-24">{t('admin.weather.pre')}</span>
                                            <div className="flex-1 px-4"><div className="h-1 bg-gray-200 rounded"></div></div>
                                            <span className="font-semibold text-gray-700">{t('admin.weather.clear')}, 32°C</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 w-24">{t('admin.weather.during')}</span>
                                            <div className="flex-1 px-4"><div className="h-1 bg-red-200 rounded"></div></div>
                                            <span className="font-semibold text-red-600">{t('admin.weather.severe')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 w-24">{t('admin.weather.post')}</span>
                                            <div className="flex-1 px-4"><div className="h-1 bg-emerald-200 rounded"></div></div>
                                            <span className="font-semibold text-gray-700">{t('admin.weather.cloudy')}, 28°C</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-5 blur-[80px] rounded-full pointer-events-none"></div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10">
                                        <div>
                                            <h3 className="font-bold text-emerald-400 text-lg tracking-wide">{t('admin.ndvi.title')}</h3>
                                            <p className="text-gray-400 text-xs mt-1">{t('admin.ndvi.subtitle')}</p>
                                        </div>
                                        <span className="mt-2 sm:mt-0 text-[10px] font-mono text-emerald-300 bg-emerald-900/50 border border-emerald-800 px-3 py-1 rounded-full uppercase tracking-widest">
                                            {t('admin.ndvi.live_gis')}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                                        <div className="bg-black/50 border border-gray-700 rounded-xl overflow-hidden">
                                            <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs text-center text-gray-300 font-semibold">{t('admin.ndvi.pre_img')}</div>
                                            <div className="h-32 bg-emerald-900/30 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60')] bg-cover bg-center blend-overlay opacity-90">
                                                <span className="bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm">{t('admin.ndvi.ndvi_score')}: 0.82</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-gray-700 rounded-xl overflow-hidden">
                                            <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs text-center text-gray-300 font-semibold">{t('admin.ndvi.post_img')}</div>
                                            <div className="h-32 bg-red-900/30 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1590159424451-8742d095edb7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60')] bg-cover bg-center blend-overlay opacity-90">
                                                <span className="bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm">{t('admin.ndvi.ndvi_score')}: 0.31</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-gray-700 rounded-xl overflow-hidden">
                                            <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs text-center text-gray-300 font-semibold">{t('admin.ndvi.loss_heatmap')}</div>
                                            <div className="h-32 bg-gradient-to-br from-red-600 via-yellow-500 to-green-500 flex items-center justify-center opacity-70">
                                                <span className="bg-black/60 px-3 py-1 rounded text-white text-sm font-bold text-red-400 backdrop-blur-sm">{t('admin.ndvi.loss')}: -{selectedClaim.damage_percentage?.toFixed(1) || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-lg p-4 relative z-10 flex gap-3 items-start">
                                        <div className="text-emerald-400 mt-0.5">✨</div>
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-300">{t('admin.insight.title')}</p>
                                            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                                                {selectedClaim.damage_percentage > 50 
                                                    ? t('admin.insight.high_stress').replace('Ha', `${selectedClaim.area_hectares ? selectedClaim.area_hectares.toFixed(2) : ''} Ha`)
                                                    : t('admin.insight.mod_stress')}
                                                {" "} {t('admin.insight.correlation').replace('event', selectedClaim.event_type)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-bold text-gray-800 mb-2">{t('admin.decision.title')}</h3>
                                <textarea
                                    className="w-full border border-gray-300 bg-white p-4 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none shadow-sm"
                                    rows="3"
                                    placeholder={t('admin.decision.placeholder')}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                ></textarea>

                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleUpdateStatus('Approved')}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition flex-grow flex items-center justify-center transform hover:-translate-y-0.5"
                                    >
                                        {t('admin.decision.approve')}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('Rejected')}
                                        className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition flex-grow flex items-center justify-center transform hover:-translate-y-0.5"
                                    >
                                        {t('admin.decision.reject')}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('Verified')}
                                        className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition flex-grow flex items-center justify-center transform hover:-translate-y-0.5"
                                    >
                                        {t('admin.decision.verify')}
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="glass h-[800px] rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center p-8">
                            <div className="bg-emerald-50 p-8 rounded-full mb-6 shadow-inner ring-4 ring-emerald-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-emerald-500">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">{t('admin.empty.title')}</h3>
                            <p className="text-gray-500 mt-3 max-w-md text-lg leading-relaxed">
                                {t('admin.empty.desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

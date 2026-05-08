import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, useMapEvents } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as turfArea from '@turf/area';
import * as turfCenter from '@turf/center';
import * as turfLength from '@turf/length';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useTranslation } from '../i18n/LanguageContext';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Component to add search bar
const SearchField = () => {
    const map = useMap();
    const { t } = useTranslation();
    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: true,
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: false,
            searchLabel: t('new_claim.map.search')
        });
        map.addControl(searchControl);
        return () => map.removeControl(searchControl);
    }, [map, t]);
    return null;
};

// Component to listen to map movements for minimap
const MapEvents = ({ setMapCenter, setMapZoom }) => {
    useMapEvents({
        move: (e) => setMapCenter(e.target.getCenter()),
        zoom: (e) => setMapZoom(e.target.getZoom()),
    });
    return null;
};

const NewClaim = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [formData, setFormData] = useState({
        farmer_name: '',
        phone_number: '',
        village: '',
        farmer_id: '',
        crop_type: '',
        sowing_date: '',
        expected_harvest_date: '',
        event_type: '',
        event_start_date: '',
        event_end_date: '',
        requested_claim_amount: ''
    });
    const [polygonData, setPolygonData] = useState(null);
    const [areaInfo, setAreaInfo] = useState({ acres: 0, hectares: 0, perimeter: 0, center: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Map Sync State
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapZoom, setMapZoom] = useState(5);
    const [mapInstance, setMapInstance] = useState(null);
    const featureGroupRef = useRef(null);

    // Update Leaflet Draw UX strings whenever language changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.L && window.L.drawLocal) {
            window.L.drawLocal.draw.handlers.polygon.tooltip.start = t('new_claim.map.tooltip_start');
            window.L.drawLocal.draw.handlers.polygon.tooltip.cont = t('new_claim.map.tooltip_cont');
            window.L.drawLocal.draw.handlers.polygon.tooltip.end = t('new_claim.map.tooltip_end');
            window.L.drawLocal.draw.handlers.polygon.error = `<strong>${t('new_claim.map.error_cross')}</strong>`;
        }
    }, [t, language]);

    const toggleFullScreen = (e) => {
        e.preventDefault();
        const elem = document.getElementById('map-wrapper');
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleLocateMe = (e) => {
        e.preventDefault();
        if (mapInstance) {
            mapInstance.locate({ setView: true, maxZoom: 18 });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const _onCreated = (e) => {
        const layer = e.layer;
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            featureGroupRef.current.addLayer(layer);
        }
        const geojson = layer.toGeoJSON();
        setPolygonData(geojson);
        updateAreaInfo(geojson);
    };

    const _onEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer(layer => {
            const geojson = layer.toGeoJSON();
            setPolygonData(geojson);
            updateAreaInfo(geojson);
        });
    };

    const _onDeleted = (e) => {
        setPolygonData(null);
        setAreaInfo({ acres: 0, hectares: 0, perimeter: 0, center: null });
    };

    const updateAreaInfo = (geojson) => {
        try {
            const sqMeters = turfArea.area(geojson);
            const hectares = sqMeters / 10000;
            const acres = hectares * 2.47105;
            const perimeterKm = turfLength.length(geojson);
            const perimeterMeters = perimeterKm * 1000;
            const centerPoint = turfCenter.center(geojson);
            const coords = centerPoint.geometry.coordinates;
            
            setAreaInfo({
                acres: acres.toFixed(2),
                hectares: hectares.toFixed(2),
                perimeter: perimeterMeters.toFixed(2),
                center: { lat: coords[1].toFixed(4), lng: coords[0].toFixed(4) }
            });
        } catch (err) {
            console.error("Error calculating area:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!polygonData) {
            setError(t('new_claim.error_polygon'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                polygon_geojson: JSON.stringify(polygonData),
                area_acres: parseFloat(areaInfo.acres),
                area_hectares: parseFloat(areaInfo.hectares)
            };
            const response = await axios.post('http://localhost:8000/api/claims', payload);
            navigate('/status', { state: { claimId: response.data.claim_id } });
        } catch (err) {
            console.error(err);
            setError(t('new_claim.error_submit'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-gradient">{t('new_claim.title')}</h1>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 group-hover:bg-emerald-500 transition-colors"></div>
                        <h2 className="text-xl font-bold mb-4 border-b border-emerald-100 pb-2 text-emerald-800">{t('new_claim.personal_details')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.farmer_name')}</label>
                                <input required type="text" name="farmer_name" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.phone_number')}</label>
                                <input required type="text" name="phone_number" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.village')}</label>
                                <input required type="text" name="village" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.farmer_id')}</label>
                                <input required type="text" name="farmer_id" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.requested_amount')}</label>
                                <input required type="number" min="0" step="0.01" name="requested_claim_amount" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 text-lg font-semibold text-emerald-900 bg-white/70" placeholder="e.g. 5000" />
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-400 group-hover:bg-teal-500 transition-colors"></div>
                        <h2 className="text-xl font-bold mb-4 border-b border-emerald-100 pb-2 text-emerald-800">{t('new_claim.disaster_details')}</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.crop_type')}</label>
                                <select required name="crop_type" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 bg-white/50">
                                    <option value="">{t('new_claim.crops.select')}</option>
                                    <option value="Sugarcane">{t('new_claim.crops.sugarcane')}</option>
                                    <option value="Millets">{t('new_claim.crops.millets')}</option>
                                    <option value="Soybeans">{t('new_claim.crops.soybeans')}</option>
                                    <option value="Pulses">{t('new_claim.crops.pulses')}</option>
                                    <option value="Barley">{t('new_claim.crops.barley')}</option>
                                    <option value="Cotton">{t('new_claim.crops.cotton')}</option>
                                    <option value="Groundnut">{t('new_claim.crops.groundnut')}</option>
                                    <option value="Sunflower">{t('new_claim.crops.sunflower')}</option>
                                    <option value="Maize">{t('new_claim.crops.maize')}</option>
                                    <option value="Tea">{t('new_claim.crops.tea')}</option>
                                    <option value="Coffee">{t('new_claim.crops.coffee')}</option>
                                    <option value="Wheat">{t('new_claim.crops.wheat')}</option>
                                    <option value="Rice">{t('new_claim.crops.rice')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.event_type')}</label>
                                <select required name="event_type" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 bg-white/50">
                                    <option value="">{t('new_claim.events.select')}</option>
                                    <option value="Cyclone">{t('new_claim.events.cyclone')}</option>
                                    <option value="Hailstorm">{t('new_claim.events.hailstorm')}</option>
                                    <option value="Wildfire">{t('new_claim.events.wildfire')}</option>
                                    <option value="Landslide">{t('new_claim.events.landslide')}</option>
                                    <option value="Unseasonal Rain">{t('new_claim.events.rain')}</option>
                                    <option value="Heavy Flood">{t('new_claim.events.flood')}</option>
                                    <option value="Heatwave">{t('new_claim.events.heatwave')}</option>
                                    <option value="Pest Attack">{t('new_claim.events.pest')}</option>
                                    <option value="Disease Outbreak">{t('new_claim.events.disease')}</option>
                                    <option value="Waterlogging">{t('new_claim.events.waterlogging')}</option>
                                    <option value="Thunderstorm">{t('new_claim.events.thunderstorm')}</option>
                                    <option value="Drought">{t('new_claim.events.drought')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.sowing_date')}</label>
                                <input required type="date" name="sowing_date" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 text-gray-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.expected_harvest')}</label>
                                <input required type="date" name="expected_harvest_date" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 text-gray-700" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.event_start')}</label>
                                <input required type="date" name="event_start_date" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 text-gray-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('new_claim.event_end')}</label>
                                <input required type="date" name="event_end_date" onChange={handleChange} className="mt-1 block w-full rounded-xl input-glass p-3 text-gray-700" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-400 group-hover:bg-green-500 transition-colors"></div>
                    <h2 className="text-xl font-bold mb-4 border-b border-emerald-100 pb-2 text-emerald-800">{t('new_claim.location_title')}</h2>
                    <p className="text-sm text-gray-500 mb-4">{t('new_claim.location_desc')}</p>
                    <div className="flex-grow z-0 min-h-[500px] border border-green-200 rounded-xl overflow-hidden shadow-inner relative group/map" id="map-wrapper">
                        
                        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 opacity-0 group-hover/map:opacity-100 transition-opacity duration-300">
                            <button onClick={toggleFullScreen} className="bg-black/70 hover:bg-black text-white p-2 rounded shadow backdrop-blur-md transition-colors" title="Toggle Fullscreen">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                            </button>
                            <button onClick={handleLocateMe} className="bg-blue-600/90 hover:bg-blue-700 text-white p-2 rounded shadow backdrop-blur-md transition-colors" title="Locate Me (GPS)">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </button>
                        </div>

                        <div className="absolute bottom-4 right-4 w-32 h-32 border-2 border-white/50 rounded-lg overflow-hidden z-[1000] shadow-xl pointer-events-none opacity-80 group-hover/map:opacity-100 transition-opacity">
                            <MapContainer 
                                center={mapCenter} 
                                zoom={Math.max(1, mapZoom - 4)} 
                                zoomControl={false} 
                                dragging={false} 
                                scrollWheelZoom={false} 
                                doubleClickZoom={false} 
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            </MapContainer>
                        </div>

                        <MapContainer 
                            center={[20.5937, 78.9629]} 
                            zoom={5} 
                            maxZoom={22} 
                            style={{ height: '100%', width: '100%' }}
                            ref={setMapInstance}
                        >
                            <SearchField />
                            <MapEvents setMapCenter={setMapCenter} setMapZoom={setMapZoom} />
                            
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga"
                                maxZoom={22}
                            />
                            <FeatureGroup ref={featureGroupRef}>
                                <EditControl
                                    position="topleft"
                                    onCreated={_onCreated}
                                    onEdited={_onEdited}
                                    onDeleted={_onDeleted}
                                    draw={{
                                        rectangle: false,
                                        circle: false,
                                        circlemarker: false,
                                        marker: false,
                                        polyline: false,
                                        polygon: {
                                            allowIntersection: false,
                                            drawError: {
                                                color: '#e1e100',
                                                message: `<strong>${t('new_claim.map.error_cross')}</strong>`
                                            },
                                            shapeOptions: {
                                                color: '#0ea5e9',
                                                weight: 3,
                                                fillOpacity: 0.4
                                            }
                                        }
                                    }}
                                />
                            </FeatureGroup>
                        </MapContainer>
                    </div>
                    
                    {polygonData && (
                        <div className="mt-4 p-5 glass border border-emerald-200 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 opacity-10 blur-3xl rounded-full"></div>
                            <div>
                                <p className="text-sm text-emerald-800 font-bold flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {t('new_claim.boundary_captured')}
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 font-mono">
                                    <p>{t('new_claim.lat')}: <span className="font-bold text-gray-800">{areaInfo.center?.lat}</span></p>
                                    <p>{t('new_claim.lng')}: <span className="font-bold text-gray-800">{areaInfo.center?.lng}</span></p>
                                </div>
                            </div>
                            <div className="text-right flex gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t('new_claim.perimeter')}</p>
                                    <p className="text-xl font-black text-gray-700">{areaInfo.perimeter} <span className="text-sm font-medium text-gray-500">m</span></p>
                                </div>
                                <div className="border-l border-gray-200 pl-6">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">{t('new_claim.calculated_area')}</p>
                                    <p className="text-2xl font-black text-emerald-700">{areaInfo.acres} <span className="text-base font-medium text-emerald-600/70">{t('new_claim.acres')}</span></p>
                                    <p className="text-sm font-bold text-gray-500">{areaInfo.hectares} <span className="font-medium text-gray-400">{t('new_claim.hectares')}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                    {!polygonData && (
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                            {t('new_claim.waiting_polygon')}
                        </p>
                    )}
                </div>

                <div className="md:col-span-2 text-right mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-10 py-4 rounded-xl text-lg w-full md:w-auto disabled:opacity-50"
                    >
                        {loading ? t('new_claim.submitting') : t('new_claim.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewClaim;

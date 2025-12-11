import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { 
    Cloud, Sunrise, Sunset, Droplet, Wind, Thermometer, MapPin, 
    AlertTriangle, RefreshCw, Sun, CloudRain, Newspaper, Calendar, 
    User, Globe, Zap, Activity, Plus, FileText, Eye, Users, Clock 
} from 'lucide-react'; 

const MATI_LAT = 6.95508; 
const MATI_LON = 126.217; 
const API_KEY = '19b56e51c81ae2ba703c3dfdb8840517'; 

const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const API_BASE_URL = 'http://localhost:5000/api'; 

const getCategoryColor = (category) => {
    switch (category) {
        case 'Emergency Alert': return { bg: '#FEE2E2', text: '#DC2626', icon: Zap }; 
        case 'Public Advisory': return { bg: '#FEF3C7', text: '#D97706', icon: Globe }; 
        case 'Community Activity': return { bg: '#D1FAE5', text: '#059669', icon: Activity }; 
        case 'Health Advisory': return { bg: '#DBEAFE', text: '#2563EB', icon: Plus }; 
        case 'Events': return { bg: '#EDE9FE', text: '#7C3AED', icon: Calendar }; 
        case 'Ordinances / Resolutions': return { bg: '#E5E7EB', text: '#374151', icon: FileText }; 
        default: return { bg: '#F3F4F6', text: '#6B7280', icon: Newspaper }; 
    }
};

const getWeatherIcon = (iconCode, size = 36) => { 
    switch (iconCode) {
        case '01d': return <Sun size={size} color="#f59e0b" />; 
        case '01n': return <Sun size={size} color="#3b82f6" />;
        case '02d': 
        case '03d': return <Cloud size={size} color="#94a3b8" />;
        case '02n':
        case '03n': return <Cloud size={size} color="#94a3b8" />; 
        case '04d': 
        case '04n': return <Cloud size={size} color="#64748b" />; 
        case '09d': 
        case '09n': return <CloudRain size={size} color="#2563eb" />; 
        case '10d': 
        case '10n': return <Droplet size={size} color="#0ea5e9" />; 
        case '11d': 
        case '11n': return <Zap size={size} color="#f97316" />; 
        case '13d': 
        case '13n': return <Wind size={size} color="#94a3b8" />;
        case '50d': 
        case '50n': return <Wind size={size} color="#94a3b8" />; 
        default: return <Sun size={size} color="#f59e0b" />;
    }
};

const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000); 
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
};


const baseViewModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    modal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative'
    },
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700'
    },
    contentGrid: { 
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '20px' 
    },
    detailBox: { 
        padding: '15px', border: '1px solid #E5E7EB', borderRadius: '10px', 
        backgroundColor: '#F9FAFB' 
    },
    detailLabel: { 
        fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '5px' 
    },
    detailValue: { 
        fontSize: '16px', color: '#1F2937', fontWeight: '500' 
    },
    closeButton: { 
        padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        fontSize: '16px', transition: 'background-color 0.2s', width: '100%' 
    }
};

const NewsViewModal = ({ show, newsItem, onClose }) => {
    if (!show || !newsItem) return null;

    const tagColor = getCategoryColor(newsItem.category);
    const TagIcon = tagColor.icon;
    
    let attachments = [];
    try {
        attachments = Array.isArray(newsItem.attachments) 
            ? newsItem.attachments 
            : (newsItem.attachments_json ? JSON.parse(newsItem.attachments_json) : []);
    } catch (e) {
        console.error("Failed to parse attachments JSON in view modal:", e);
    }

    const cardTagStyle = (color) => ({
        backgroundColor: color.bg, color: color.text, 
        padding: '6px 10px', borderRadius: '9999px', 
        fontSize: '14px', fontWeight: '700', 
        display: 'inline-flex', alignItems: 'center', gap: '8px'
    });
    
    return (
        <div style={baseViewModalStyles.backdrop}>
            <div style={baseViewModalStyles.modal}>
                <h3 style={baseViewModalStyles.header}>
                    <Eye size={28} /> Full News Details: {newsItem.title}
                </h3>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#6B7280' }}
                >
                    &times;
                </button>

                <div style={baseViewModalStyles.contentGrid}>
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <span style={cardTagStyle(tagColor)}>
                                    <TagIcon size={16} /> {newsItem.category}
                                </span>
                                <div style={{...baseViewModalStyles.detailValue, fontSize: '14px', color: '#9CA3AF'}}>
                                    <Calendar size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Published: {formatDate(newsItem.date_published, true)}
                                </div>
                            </div>
                            
                            {newsItem.featured_image_url && (
                                <img 
                                    src={newsItem.featured_image_url} 
                                    alt={newsItem.title} 
                                    style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '10px', marginBottom: '20px' }} 
                                />
                            )}

                            <h4 style={{fontSize: '22px', color: '#1F2937', fontWeight: '700', marginBottom: '10px'}}>Description</h4>
                            <p style={{fontSize: '16px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                                {newsItem.content}
                            </p>
                        </div>

                        {attachments.length > 0 && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                                <h4 style={{fontSize: '20px', color: '#1F2937', fontWeight: '700', marginBottom: '15px'}}><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Available Attachments</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {attachments.map((att, index) => (
                                        <a key={index} href={att} target="_blank" rel="noopener noreferrer" 
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '8px', 
                                                padding: '10px 15px', backgroundColor: '#DBEAFE', 
                                                borderRadius: '8px', color: '#1E40AF', textDecoration: 'none', 
                                                fontWeight: '600', transition: 'background-color 0.2s'
                                            }}>
                                            <FileText size={16}/> View Attachment {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Posted By</div>
                            <div style={baseViewModalStyles.detailValue}>{newsItem.posted_by}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Users size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Target Audience</div>
                            <div style={baseViewModalStyles.detailValue}>{newsItem.target_audience}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Valid Until (Expiry)</div>
                            <div style={{...baseViewModalStyles.detailValue, color: newsItem.valid_until ? '#B91C1C' : '#059669'}}>
                                {newsItem.valid_until ? formatDate(newsItem.valid_until, false) : 'No Expiry Set'}
                            </div>
                        </div>
                        
                        <div style={{marginTop: '15px'}}>
                            <button onClick={onClose} style={baseViewModalStyles.closeButton}>
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderRadius: '10px',
    },
    header: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px',
    },
    weatherContainer: {
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#ffffff',
    },
    weatherHeader: {
        fontSize: '1.4rem', 
        color: '#1e3a8a',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #eff6ff',
        paddingBottom: '8px', 
        marginBottom: '10px', 
        fontWeight: '600',
    },
    currentWeather: {
        display: 'flex',
        alignItems: 'flex-start', 
        flexWrap: 'wrap',
        gap: '20px', 
    },
    tempDisplay: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '200px', 
    },
    mainTemp: {
        fontSize: '3rem',
        fontWeight: '300',
        color: '#0369a1',
    },
    conditionText: {
        fontSize: '1.1rem',
        color: '#475569',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    detailsGrid: {
        flexGrow: 1, 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '10px',
        marginTop: '0', 
    },
    detailBox: {
        backgroundColor: '#f8fafc',
        padding: '8px', 
        borderRadius: '6px',
        textAlign: 'center',
        border: '1px solid #e0f2f1',
    },
    detailValue: {
        fontSize: '1rem', 
        fontWeight: '600',
        color: '#0f766e',
        lineHeight: '1.2',
    },
    detailLabel: {
        fontSize: '0.7rem', 
        color: '#64748b',
        marginTop: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
    },
    forecastContainer: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
    },
    forecastHeader: {
        fontSize: '1.2rem', 
        color: '#1e3a8a',
        marginBottom: '10px',
        fontWeight: '600',
        borderBottom: '1px dashed #93c5fd',
        paddingBottom: '5px',
    },
    tomorrowForecast: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    forecastItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1rem', 
        color: '#475569',
    },
    tempRange: {
        fontSize: '1.1rem', 
        fontWeight: '700',
        color: '#0e7490',
    },
    error: {
        textAlign: 'center',
        padding: '20px',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        border: '1px solid #fca5a5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },

    newsSectionHeader: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px',
    },
    newsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
    },
    newsCard: {
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        cursor: 'pointer',
        border: '1px solid #e5e7eb',
    },
    newsCardHover: {
        transform: 'translateY(-3px)',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
    },
    cardImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderBottom: '1px solid #f3f4f6',
    },
    cardContent: {
        padding: '15px',
        flexGrow: 1,
    },
    cardTag: (color) => ({
        backgroundColor: color.bg,
        color: color.text,
        padding: '4px 8px',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        marginBottom: '10px',
    }),
    cardTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '8px',
        lineHeight: '1.3',
    },
    cardMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        fontSize: '0.9rem',
        color: '#6b7280',
    },
    readMoreButton: {
        background: '#1e40af', 
        color: 'white', 
        border: 'none', 
        padding: '8px 15px', 
        borderRadius: '6px', 
        cursor: 'pointer', 
        fontWeight: '600',
        display: 'inline-flex', 
        alignItems: 'center', 
        transition: 'background-color 0.2s',
        fontSize: '0.9rem',
        marginTop: '10px', 
    },
    loadingText: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2rem',
        color: '#6b7280',
    }
};

const NewsCard = ({ newsItem, onReadMore }) => { 
    const [isHovered, setIsHovered] = useState(false);
    const tagColor = getCategoryColor(newsItem.category);
    const TagIcon = tagColor.icon;
    
    const snippet = newsItem.content.substring(0, 100) + (newsItem.content.length > 100 ? '...' : '');

    const handleCardClick = (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) { 
            onReadMore(newsItem);
        }
    };

    return (
        <div 
            style={{ 
                ...styles.newsCard, 
                ...(isHovered ? styles.newsCardHover : {}) 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
        >
            {newsItem.featured_image_url ? (
                <img 
                    src={newsItem.featured_image_url} 
                    alt={newsItem.title} 
                    style={styles.cardImage} 
                />
            ) : (
                <div style={{ ...styles.cardImage, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <Newspaper size={40} />
                </div>
            )}
            <div style={styles.cardContent}>
                <span style={styles.cardTag(tagColor)}>
                    <TagIcon size={14} /> {newsItem.category}
                </span>
                <h3 style={styles.cardTitle}>{newsItem.title}</h3>
                <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '10px' }}>{snippet}</p>
                
                <button 
                    style={styles.readMoreButton}
                    onClick={() => onReadMore(newsItem)} 
                >
                    <Eye size={16} style={{ marginRight: '6px' }} /> Read More
                </button>

                <div style={styles.cardMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={14} /> {newsItem.posted_by}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} /> {formatDate(newsItem.date_published)}
                    </span>
                </div>
            </div>
        </div>
    );
};


const NewsPage = () => {
    const [weather, setWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [weatherError, setWeatherError] = useState(null);

    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsError, setNewsError] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedNewsForView, setSelectedNewsForView] = useState(null);
    
    const handleReadMore = (newsItem) => {
        setSelectedNewsForView(newsItem);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedNewsForView(null);
    };


    const fetchWeather = async () => {
        setLoadingWeather(true);
        setWeatherError(null);
        try {
            const response = await axios.get(WEATHER_API_BASE_URL, {
                params: {
                    lat: MATI_LAT,
                    lon: MATI_LON,
                    appid: API_KEY,
                    units: 'metric',
                },
            });

            setWeather(response.data);
        } catch (err) {
            console.error("Weather Fetch Error:", err);
            setWeatherError('Failed to load weather data. Please check the API key.');
        } finally {
            setLoadingWeather(false);
        }
    };
    
    const fetchNews = async () => {
        setNewsLoading(true);
        setNewsError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/news`);
            setNews(response.data);
        } catch (err) {
            console.error("News Fetch Error:", err);
            setNewsError('Could not fetch barangay news. Please try again later.');
        } finally {
            setNewsLoading(false);
        }
    };

    useEffect(() => {
        document.title = "News";
        fetchWeather();
        fetchNews();
    }, []); 

    const todayData = weather?.list[0];
    const sys = weather?.city;
    const todayMain = todayData?.main;
    const todayWeather = todayData?.weather[0];

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowForecastPoint = weather?.list.find(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.getDate() === tomorrow.getDate() && itemDate.getHours() >= 10 && itemDate.getHours() <= 14;
    });

    const tomorrowList = weather?.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.getDate() === tomorrow.getDate();
    });

    const tomorrowTemp = tomorrowForecastPoint?.main.temp;
    const tomorrowCondition = tomorrowForecastPoint?.weather[0];
    const tomorrowMax = tomorrowList?.reduce((max, item) => Math.max(max, item.main.temp_max), -Infinity);
    const tomorrowMin = tomorrowList?.reduce((min, item) => Math.min(min, item.main.temp_min), Infinity);


    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Barangay News & Weather</h1> 

            <div style={styles.weatherContainer}>
                <h2 style={styles.weatherHeader}>
                    <MapPin size={20} /> Current Weather in {sys?.name || 'Mati City'}
                </h2>
            
                {loadingWeather && !weatherError && (
                    <div style={styles.error}>
                        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading weather data...
                    </div>
                )}
                
                {weatherError && (
                    <div style={styles.error}>
                        <AlertTriangle size={20} /> {weatherError}
                    </div>
                )}

                {weather && todayData && (
                    <div>
                        <div style={styles.currentWeather}>
                            
                            <div style={styles.tempDisplay}>
                                {todayWeather && getWeatherIcon(todayWeather.icon, 40)} 
                                <div>
                                    <div style={styles.mainTemp}>{todayMain.temp.toFixed(0)}°C</div>
                                    <div style={styles.conditionText}>{todayWeather.description}</div>
                                </div>
                            </div>
                            
                            <div style={styles.detailsGrid}>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{todayMain.humidity}%</div>
                                    <div style={styles.detailLabel}><Droplet size={10} /> Humidity</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{(todayMain.pressure * 0.75006).toFixed(0)} mmHg</div>
                                    <div style={styles.detailLabel}>Pressure</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{todayData.wind.speed.toFixed(1)} m/s</div>
                                    <div style={styles.detailLabel}><Wind size={10} /> Wind</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{todayMain.temp_max.toFixed(0)}°C</div>
                                    <div style={styles.detailLabel}><Thermometer size={10} /> High</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{todayMain.temp_min.toFixed(0)}°C</div>
                                    <div style={styles.detailLabel}><Thermometer size={10} /> Low</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{formatTime(sys?.sunrise)}</div>
                                    <div style={styles.detailLabel}><Sunrise size={10} /> Sunrise</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{formatTime(sys?.sunset)}</div>
                                    <div style={styles.detailLabel}><Sunset size={10} /> Sunset</div>
                                </div>
                                <div style={styles.detailBox}>
                                    <div style={styles.detailValue}>{formatDate(new Date(todayData.dt * 1000).toISOString(), true)}</div>
                                    <div style={styles.detailLabel}><RefreshCw size={10} /> Updated</div>
                                </div>
                            </div>
                        </div>

                        {tomorrowTemp !== undefined && tomorrowMax !== undefined && tomorrowCondition && (
                            <div style={styles.forecastContainer}>
                                <h3 style={styles.forecastHeader}>Tomorrow's Forecast</h3>
                                <div style={styles.tomorrowForecast}>
                                    <div style={styles.forecastItem}>
                                        {getWeatherIcon(tomorrowCondition.icon, 20)}
                                        <span style={styles.conditionText}>{tomorrowCondition.description}</span>
                                    </div>
                                    <div style={styles.tempRange}>
                                        {tomorrowMin.toFixed(0)}°C / {tomorrowMax.toFixed(0)}°C
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>

            <h2 style={styles.newsSectionHeader}>
                 Community News & Updates
            </h2>

            {newsError && (
                <div style={{ ...styles.error, color: '#dc2626', backgroundColor: '#fee2e2' }}>
                    <AlertTriangle size={24} style={{ marginRight: '10px' }} /> {newsError}
                </div>
            )}

            {newsLoading ? (
                <div style={styles.loadingText}>
                    <RefreshCw size={24} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} /> Loading news feed...
                </div>
            ) : news.length > 0 ? (
                <div style={styles.newsGrid}>
                    {news.map(item => (
                        <NewsCard 
                            key={item.id} 
                            newsItem={item} 
                            onReadMore={handleReadMore}
                        />
                    ))}
                </div>
            ) : (
                <div style={styles.loadingText}>
                    No official news or announcements have been posted yet.
                </div>
            )}
            
            <NewsViewModal
                show={isViewModalOpen}
                newsItem={selectedNewsForView}
                onClose={handleCloseViewModal}
            />

        </div>
    );
};

export default NewsPage;
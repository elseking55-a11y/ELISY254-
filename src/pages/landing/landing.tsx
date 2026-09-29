import { useEffect, useState, type CSSProperties } from 'react';
import { generateOAuthURL, getDomainConfig } from '@/components/shared';
import RiskDisclaimerFloating from '@/components/risk-disclaimer-floating';
import './landing.scss';

const TRUST_BADGES = ['Free to use', 'Your own Deriv account', 'No card required'];

const FEATURES = [
    {
        tag: 'BUILD',
        title: 'Drag-and-drop bot builder',
        description: 'Snap blocks together to define entry rules, stakes, and stop conditions — no code required.',
    },
    {
        tag: 'BOTS',
        title: '60+ free bots',
        description: 'Load a ready-made strategy straight into the builder and see exactly how it works before you run it.',
    },
    {
        tag: 'SIGNALS',
        title: 'Live digits & charts',
        description: 'Watch the same tick stream your bots trade on — even/odd, over/under, rise/fall — in real time.',
    },
    {
        tag: 'CONTROL',
        title: 'Your account, your rules',
        description: 'Every trade runs on your own Deriv account. Nothing executes without a strategy you approved first.',
    },
];

const TODAY_FEATURES = [
    { tag: 'BOT BUILDER', title: 'Bot Builder', description: 'Build and edit Deriv strategies visually with the block workspace.' },
    { tag: 'FREE BOTS', title: 'Free Bots', description: 'Browse available ready-made strategies and load them into the builder.' },
    { tag: 'MANUAL', title: 'Manual Trading', description: 'Use the trading interface directly with your connected Deriv account.' },
    { tag: 'ANALYSIS', title: 'Analysis Tools', description: 'Study market movement, ticks and strategy conditions before trading.' },
    { tag: 'CHARTS', title: 'Chart', description: 'View market charts and follow price movement in the trading workspace.' },
    { tag: 'DTRADER', title: 'DTrader', description: 'Access the Deriv trading interface alongside the ELISY254 workspace.' },
    { tag: 'BULK', title: 'Bulk Trading', description: 'Manage multiple trading actions from one dedicated workspace.' },
    { tag: 'APEX', title: 'Apex Bot', description: 'Explore the Apex Bot workspace when it is enabled for your account.' },
    { tag: 'MARKET', title: 'Market Hacker', description: 'Use the Market Hacker tools to inspect available market conditions.' },
    { tag: 'AI', title: 'AI Hub', description: 'Access the AI-powered strategy workspace when enabled.' },
];

const STEPS = [
    {
        step: '01',
        title: 'Create your Deriv account',
        description: 'Free, and takes about two minutes. Your funds stay with Deriv — we never touch them directly.',
    },
    {
        step: '02',
        title: 'Load or build a bot',
        description: 'Pick a free strategy from the library, or drag your own together in the visual builder.',
    },
    {
        step: '03',
        title: 'Run it and watch the ticks',
        description: 'Start the bot, track every trade live, and stop it any time — you stay in control throughout.',
    },
];

// A sample of real strategy names pulled from the bot library, used for the
// scrolling preview strip below the hero. Duplicated once for a seamless loop.
const BOT_PREVIEWS = [
    'Even/Odd Digit Bot',
    'Over/Under Speed Bot',
    'Rise & Fall Momentum',
    'Double Under Bot',
    'Percentage Over Bot',
    'Matches/Differs Scanner',
];

// Landing-page messages are intentionally editable in one place.
// They are presented as community-style inspiration, not verified performance claims.
const LANDING_MESSAGES = [
    { name: 'AMOSE', message: 'Congratulations ELISY254 — the new bot features make the platform more interesting and easier to explore.' },
    { name: 'EUGEN', message: 'I really like the Bot Builder. The blocks make it easier to understand a strategy before running it.' },
    { name: 'BRIAN', message: 'Big congratulations on the Free Bots library. Loading a strategy and studying the blocks is a great feature.' },
    { name: 'MERCY', message: 'The landing page looks beautiful. The colours, cards and smooth experience make the platform feel fresh.' },
    { name: 'KEVIN', message: 'The new trading tools are impressive. I like having different features in one place instead of jumping between pages.' },
    { name: 'JANE', message: 'Congratulations on the latest update. The strategy-building experience is becoming much easier to follow.' },
    { name: 'COLLINS', message: 'The bot cards are clean and easy to understand. This makes finding a strategy much faster.' },
    { name: 'FAITH', message: 'I love the way the features are organised. Bot Builder, Free Bots and the trading tools are easy to discover.' },
    { name: 'SAM', message: 'The new updates are looking sharp. Keep improving the tools and adding useful strategy features.' },
    { name: 'MARTIN', message: 'Congratulations to the ELISY254 team. The platform has a strong collection of tools for learning and testing strategies.' },
    { name: 'RACHEL', message: 'The mobile experience is much nicer. I can explore the bot features comfortably from my phone.' },
    { name: 'DAN', message: 'The strategy tools are getting better with every update. Congratulations on the progress.' },
    { name: 'PETER', message: 'I like that I can build a strategy visually instead of starting with complicated code.' },
    { name: 'GRACE', message: 'The new presentation is premium. The colours and cards give the landing page a completely different feel.' },
    { name: 'JOEL', message: 'Congratulations on the latest bot updates. Keep making the tools simple enough for new traders to learn.' },
    { name: 'NANCY', message: 'The combination of Free Bots, Bot Builder and analysis tools gives the platform a lot to explore.' },
    { name: 'ALEX', message: 'Great work on the new features. I especially like being able to inspect a strategy before deciding how to use it.' },
    { name: 'ELISY TRADER', message: 'Another strong update. Build carefully, test your strategy and keep learning.' },
];

const LANDING_SPLASHES = [
    { eyebrow: '☀️ MORNING TRADER', title: 'Good morning, trader', message: 'Start the day with a clear plan, disciplined risk and a strategy you understand.' },
    { eyebrow: '🌤️ AFTERNOON TRADER', title: 'Keep your focus', message: 'Review your setup, stay patient and let your rules guide every decision.' },
    { eyebrow: '🌆 EVENING TRADER', title: 'Review the day', message: 'Study what worked, learn from what did not and prepare for tomorrow.' },
    { eyebrow: '🌙 NIGHT TRADER', title: 'Keep learning', message: 'A strong trading routine is built one lesson, one test and one improvement at a time.' },
    { eyebrow: '🤖 BOT BUILDER', title: 'Build your strategy', message: 'Create strategies visually and understand the logic behind every block.' },
    { eyebrow: '🆓 FREE BOTS', title: 'Explore ready strategies', message: 'Browse the available bots, load a strategy and study how it is built.' },
    { eyebrow: '📊 ANALYSIS TOOLS', title: 'Study the market', message: 'Use your analysis tools to understand movement before making a trading decision.' },
    { eyebrow: '💎 PREMIUM FEATURES', title: 'More tools. More possibilities.', message: 'Explore ELISY254 features designed to keep your trading workspace connected.' },
];

// Interim testimonial copy — appreciation-toned, no specific profit/return
// claims (kept vague on purpose for compliance reasons). Swap each entry for
// a real quote as they come in from Telegram/WhatsApp.
const Landing = () => {
    const domain_config = getDomainConfig();
    const brand_name = domain_config.ui.brandName;

    const getTimeGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return {
                title: 'Good morning, trader ☀️',
                message: 'Welcome to a fresh trading day. Build your plan, test your strategy, and trade by your rules.',
                label: 'MORNING SESSION',
            };
        }

        if (hour >= 12 && hour < 17) {
            return {
                title: 'Good afternoon, trader 🌤️',
                message: 'Keep your setup clear and your decisions disciplined. Let the strategy guide the trade.',
                label: 'AFTERNOON SESSION',
            };
        }

        if (hour >= 17 && hour < 22) {
            return {
                title: 'Good evening, trader 🌆',
                message: 'Review the market, learn from the day, and prepare your next strategy with a clear head.',
                label: 'EVENING SESSION',
            };
        }

        return {
            title: 'Good night, trader 🌙',
            message: 'If you are still studying the market, keep it simple. Tomorrow brings another session to learn from.',
            label: 'NIGHT SESSION',
        };
    };

    const timeGreeting = getTimeGreeting();
    const [messageIndex, setMessageIndex] = useState(0);
    const [splashIndex, setSplashIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setMessageIndex(current => (current + 1) % LANDING_MESSAGES.length);
            setSplashIndex(current => (current + 1) % LANDING_SPLASHES.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, []);

    const handleAuthRedirect = async (prompt?: 'registration') => {
        try {
            const oauth_url = await generateOAuthURL(prompt);
            if (oauth_url) {
                window.location.replace(oauth_url);
            } else {
                console.error('Unable to generate Deriv authentication URL.');
            }
        } catch (error) {
            console.error('Deriv authentication redirect failed:', error);
        }
    };

    return (
        <div className='landing' style={{ '--landing-accent': domain_config.ui.primaryColor } as CSSProperties}>
            <header className='landing__header'>
                <div className='landing__brand'>
                    {domain_config.ui.logoUrl ? (
                        <img className='landing__logo' src={domain_config.ui.logoUrl} alt={brand_name} />
                    ) : (
                        <span className='landing__brand-name'>{brand_name}</span>
                    )}
                </div>
                <div className='landing__header-actions'>
                    <button
                        type='button'
                        className='landing__header-auth landing__header-auth--secondary'
                        onClick={() => handleAuthRedirect()}
                    >
                        Sign in
                    </button>
                    <button
                        type='button'
                        className='landing__header-auth landing__header-auth--primary'
                        onClick={() => handleAuthRedirect('registration')}
                    >
                        Sign up
                    </button>
                </div>
            </header>

            <section className='landing__welcome' aria-label='Daily trader welcome'>
                <div className='landing__welcome-glow' aria-hidden='true' />
                <div className='landing__welcome-content'>
                    <span className='landing__welcome-label'>{timeGreeting.label}</span>
                    <h2>{timeGreeting.title}</h2>
                    <p>{timeGreeting.message}</p>
                    <span className='landing__welcome-note'>{brand_name} • Learn • Build • Test • Trade</span>
                </div>
            </section>

            <section className='landing__splash' aria-live='polite'>
                <div className='landing__splash-card' key={splashIndex}>
                    <span className='landing__splash-eyebrow'>{LANDING_SPLASHES[splashIndex].eyebrow}</span>
                    <h2>{LANDING_SPLASHES[splashIndex].title}</h2>
                    <p>{LANDING_SPLASHES[splashIndex].message}</p>
                    <div className='landing__splash-shine' />
                </div>
            </section>

            <section className='landing__hero'>
                <div className='landing__trust-row'>
                    {TRUST_BADGES.map(badge => (
                        <span className='landing__trust-badge' key={badge}>
                            <svg viewBox='0 0 16 16' width='14' height='14' aria-hidden='true'>
                                <path
                                    d='M13.5 4.5 6.5 11.5 2.5 7.5'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='1.8'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                            {badge}
                        </span>
                    ))}
                </div>
                <h1 className='landing__hero-title'>
                    Automate your trades.
                    <br />
                    Watch the ticks work.
                </h1>
                <p className='landing__hero-subtitle'>
                    {brand_name} is a free, visual bot builder for Deriv — load a ready-made strategy or build your
                    own, then let it trade on your rules while you watch every tick live.
                </p>
                <div className='landing__hero-actions'>
                    <button
                        type='button'
                        className='landing__cta landing__cta--primary'
                        onClick={() => handleAuthRedirect('registration')}
                    >
                        Sign up with Deriv
                    </button>
                    <button
                        type='button'
                        className='landing__cta landing__cta--secondary'
                        onClick={() => handleAuthRedirect()}
                    >
                        Sign in with Deriv
                    </button>
                </div>
                <p className='landing__hero-note'>
                    Sign in or sign up on Deriv, then you will be returned automatically to {brand_name}.
                </p>
            </section>

            <div className='landing__carousel' aria-hidden='true'>
                <div className='landing__carousel-track'>
                    {[...BOT_PREVIEWS, ...BOT_PREVIEWS].map((name, i) => (
                        <span className='landing__carousel-chip' key={i}>
                            {name}
                        </span>
                    ))}
                </div>
            </div>

            <section className='landing__messages' aria-label='Trader messages'>
                <div className='landing__messages-heading'>
                    <span className='landing__eyebrow'>Trader voices</span>
                    <h2 className='landing__section-title'>Fresh thoughts from the trading community</h2>
                </div>
                <div className='landing__messages-window'>
                    <article className='landing__message-card landing__message-card--active' key={LANDING_MESSAGES[messageIndex].name}>
                        <div className='landing__message-topline'>
                            <span className='landing__message-dot' />
                            <span>{LANDING_MESSAGES[messageIndex].name}</span>
                        </div>
                        <p>“{LANDING_MESSAGES[messageIndex].message}”</p>
                        <span className='landing__message-caption'>Community inspiration</span>
                    </article>
                </div>
                <div className='landing__message-progress' aria-hidden='true'>
                    {LANDING_MESSAGES.map((item, index) => (
                        <span key={item.name + index} className={index === messageIndex ? 'is-active' : ''} />
                    ))}
                </div>
            </section>


            <section className='landing__features'>
                <span className='landing__eyebrow'>ELISY254 tools</span>
                <h2 className='landing__section-title'>All the tools added to the platform</h2>
                <div className='landing__feature-grid'>
                    {TODAY_FEATURES.map(feature => (
                        <div className='landing__feature-card' key={feature.title}>
                            <span className='landing__feature-tag'>{feature.tag}</span>
                            <h3 className='landing__feature-title'>{feature.title}</h3>
                            <p className='landing__feature-description'>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className='landing__features'>
                <span className='landing__eyebrow'>Platform</span>
                <h2 className='landing__section-title'>Everything you need, built in</h2>
                <div className='landing__feature-grid'>
                    {FEATURES.map(feature => (
                        <div className='landing__feature-card' key={feature.title}>
                            <span className='landing__feature-tag'>{feature.tag}</span>
                            <h3 className='landing__feature-title'>{feature.title}</h3>
                            <p className='landing__feature-description'>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>



            <section className='landing__steps'>
                <span className='landing__eyebrow'>Getting started</span>
                <h2 className='landing__section-title'>How it works</h2>
                <div className='landing__steps-grid'>
                    {STEPS.map(item => (
                        <div className='landing__step' key={item.step}>
                            <span className='landing__step-number'>{item.step}</span>
                            <h3 className='landing__step-title'>{item.title}</h3>
                            <p className='landing__step-description'>{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className='landing__cta-band'>
                <h2>Ready to see it trade?</h2>
                <p>Open a free Deriv account, then jump into {brand_name} and run your first bot in minutes.</p>
                <button
                    type='button'
                    className='landing__cta landing__cta--primary'
                    onClick={() => handleAuthRedirect('registration')}
                >
                    Sign up with Deriv
                </button>
                <button
                    type='button'
                    className='landing__cta landing__cta--secondary'
                    onClick={() => handleAuthRedirect()}
                >
                    Sign in with Deriv
                </button>
            </section>

            <footer className='landing__footer'>
                <p>
                    {brand_name} provides tools to build and run trading strategies on Deriv. Trading involves risk of
                    loss and may not be suitable for everyone. Past performance of any strategy or bot does not
                    guarantee future results.
                </p>
            </footer>

            <RiskDisclaimerFloating />
        </div>
    );
};

export default Landing;

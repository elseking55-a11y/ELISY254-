import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { getBestBotsFileUrl, getBestBotsFolder } from '@/components/shared';
import Modal from '@/components/shared_ui/modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { isPremiumProtectedBot, setActiveBot } from '@/utils/bot-tracker';
import './best-bots.scss';

// The Blockly workspace only initialises once the Bot Builder tab has been mounted
// (see WorkspaceWrapper). Users who click "Load" from Best Bots without ever having
// visited Bot Builder previously would hit an instant "Workspace not ready" failure.
// Switch to Bot Builder first, then poll briefly for the workspace to come up.
const waitForBlocklyWorkspace = (timeout_ms = 8000, interval_ms = 100) =>
    new Promise<typeof window.Blockly.derivWorkspace>((resolve, reject) => {
        const existing = window.Blockly?.derivWorkspace;
        if (existing) {
            resolve(existing);
            return;
        }
        const started_at = Date.now();
        const timer = setInterval(() => {
            const workspace = window.Blockly?.derivWorkspace;
            if (workspace) {
                clearInterval(timer);
                resolve(workspace);
            } else if (Date.now() - started_at > timeout_ms) {
                clearInterval(timer);
                reject(new Error('Workspace not ready'));
            }
        }, interval_ms);
    });

type TBot = {
    id: string;
    name: string;
    file: string;
    guide_file?: string;
    description: string;
    emoji: string;
    is_premium?: boolean;
    priority?: number;
};

type TBotManifestEntry = {
    id?: string;
    name?: string;
    file: string;
    guide_file?: string;
    description?: string;
    emoji?: string;
    is_premium?: boolean;
    priority?: number;
};

const createManifestBot = (entry: TBotManifestEntry): TBot => {
    const name = entry.name || entry.file.replace(/\.xml$/i, '');

    return {
        id: entry.id || toBotId(entry.file),
        name,
        file: entry.file,
        guide_file: entry.guide_file,
        description:
            entry.description ||
            `${name} loads into Bot Builder and executes through the standard purchase conditions.`,
        emoji: entry.emoji || 'BOT',
        is_premium: entry.is_premium,
        priority: entry.priority,
    };
};

const toBotId = (file: string) =>
    file
        .replace(/\.xml$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export const getBestBotsForFolder = (_bots_folder: string): TBot[] => [];

const BotCard = observer(({ bot, accent }: { bot: TBot; accent: 'gold' | 'silver' | 'bronze' }) => {
    const { dashboard, toolbar, ui } = useStore();
    const { setActiveTab } = dashboard;
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const guideUrl = bot.guide_file ? getBestBotsFileUrl(bot.guide_file) : '';

    const toggleGuideModal = () => {
        if (!guideUrl) return;
        setIsGuideOpen(current => !current);
    };

    const handleLoad = async () => {
        setLoading(true);
        setError(false);
        try {
            const url = getBestBotsFileUrl(bot.file);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml_text = await res.text();
            let workspace = window.Blockly?.derivWorkspace;
            if (!workspace) {
                // Mount Bot Builder so its Blockly workspace initialises, then wait for it.
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                workspace = await waitForBlocklyWorkspace();
            }
            const load_result = await load({
                block_string: xml_text,
                file_name: bot.name,
                workspace,
                from: save_types.LOCAL,
                drop_event: {},
                strategy_id: null,
                showIncompatibleStrategyDialog: false,
            });
            if (load_result?.error) throw new Error(load_result.error);
            setActiveBot('best-bot', bot.id, bot.name);
            const is_protected_bot = isPremiumProtectedBot(bot.id);
            try {
                toolbar.setStrategyProtected(
                    is_protected_bot,
                    is_protected_bot ? 'This is a premium bot and cannot be downloaded.' : undefined
                );
            } catch {
                // Keep loading the bot even if toolbar protection is unavailable.
            }
            setTimeout(() => {
                const ws = window.Blockly?.derivWorkspace;
                if (ws) {
                    ws.getAllBlocks(false).forEach(block => {
                        if (
                            [
                                'before_purchase',
                                'after_purchase',
                                'during_purchase',
                                'purchase',
                                'smart_purchase_contract',
                                'trade_again',
                            ].includes(block.type)
                        ) {
                            block.setCollapsed(true);
                            if (is_protected_bot) {
                                block.contextMenu = false;
                                block.setMovable(false);
                            }
                        }
                    });
                }
            }, 500);
            setLoaded(true);
            setTimeout(() => setLoaded(false), 3000);
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch {
            setError(true);
            setTimeout(() => setError(false), 4000);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            if (!navigator.clipboard) return;
            await navigator.clipboard.writeText(bot.name);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    };

    const cardClassName = `bb-card bb-card--${accent}${bot.is_premium ? ' bb-card--premium' : ''}${
        ui.is_dark_mode_on ? ' bb-card--dark' : ' bb-card--light'
    }`;

    return (
        <>
            <div className={cardClassName}>
                <div className='bb-card__header'>
                    <div className='bb-card__eyebrow-row'>
                        <span className='bb-card__metal-badge'>{bot.is_premium ? 'GOLD' : accent.toUpperCase()}</span>
                    </div>
                    <button
                        className={`bb-card__copy${copied ? ' bb-card__copy--copied' : ''}`}
                        type='button'
                        aria-label={`Copy ${bot.name}`}
                        onClick={handleCopy}
                    >
                        <span />
                        <span />
                    </button>
                </div>

                <h3 className='bb-card__name'>{bot.name}</h3>
                <div className='bb-card__actions'>
                    {guideUrl ? (
                        <button
                            className='bb-card__guide'
                            type='button'
                            aria-label={`${bot.name} guide`}
                            onClick={toggleGuideModal}
                        >
                            <span className='bb-card__guide-icon' />
                            Guide
                        </button>
                    ) : (
                        <div className='bb-card__guide'>
                            <span className='bb-card__guide-icon' />
                            Guide
                        </div>
                    )}
                    <button
                        className={`bb-card__btn${loaded ? ' bb-card__btn--loaded' : ''}${
                            error ? ' bb-card__btn--error' : ''
                        }`}
                        onClick={handleLoad}
                        disabled={loading}
                    >
                        <span>{loading ? 'Loading...' : loaded ? 'Loaded' : error ? 'Retry' : 'Load Bot'}</span>
                        <span className='bb-card__btn-icon'>↓</span>
                    </button>
                </div>
            </div>
            {guideUrl && (
                <Modal
                    title={`${bot.name} guide`}
                    width='min(96vw, 1040px)'
                    height='min(88vh, 820px)'
                    is_open={isGuideOpen}
                    toggleModal={toggleGuideModal}
                    should_close_on_click_outside
                    is_vertical_centered
                >
                    <Modal.Body className='bb-guide-modal__body'>
                        <iframe className='bb-guide-modal__frame' src={guideUrl} title={`${bot.name} guide`} />
                        <a className='bb-guide-modal__link' href={guideUrl} target='_blank' rel='noreferrer'>
                            Open in new tab
                        </a>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
});

const BestBots = () => {
    const botsFolder = getBestBotsFolder();
    const [bots, setBots] = useState<TBot[]>([]);

    useEffect(() => {
        let isMounted = true;

        fetch(getBestBotsFileUrl('bots.json'))
            .then(response => {
                if (!response.ok) return [];
                return response.json();
            })
            .then((manifestBots: TBotManifestEntry[]) => {
                if (!isMounted || !Array.isArray(manifestBots)) return;

                const dynamicBots = manifestBots
                    .filter(bot => bot?.file?.toLowerCase().endsWith('.xml'))
                    .map(createManifestBot);

                setBots(dynamicBots);
            })
            .catch(() => {
                if (isMounted) setBots([]);
            });

        return () => {
            isMounted = false;
        };
    }, [botsFolder]);

    const rankedBots = bots;

    return (
        <div className='best-bots'>
            <div className='best-bots__grid'>
                {rankedBots.length > 0 ? (
                    rankedBots.map((bot, index) => (
                        <BotCard
                            key={bot.id || bot.file}
                            bot={bot}
                            accent={index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'silver' : 'bronze'}
                        />
                    ))
                ) : (
                    <p>No bots configured for this domain yet.</p>
                )}
            </div>
        </div>
    );
};

export default BestBots;export const getBestBotsForFolder = (bots_folder: string) => BOTS_BY_FOLDER[bots_folder] ?? [];

const BotCard = observer(({ bot, stats }: { bot: TBot; stats: TBotStats | undefined }) => {
    const { dashboard, toolbar, ui } = useStore();
    const { setActiveTab } = dashboard;
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const guideUrl = bot.guide_file ? getBestBotsFileUrl(bot.guide_file) : '';

    const toggleGuideModal = () => {
        if (!guideUrl) return;
        setIsGuideOpen(current => !current);
    };

    const handleLoad = async () => {
        setLoading(true);
        setError(false);
        try {
            const url = getBestBotsFileUrl(bot.file);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml_text = await res.text();
            let workspace = window.Blockly?.derivWorkspace;
            if (!workspace) {
                // Mount Bot Builder so its Blockly workspace initialises, then wait for it.
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                workspace = await waitForBlocklyWorkspace();
            }
            const load_result = await load({
                block_string: xml_text,
                file_name: bot.name,
                workspace,
                from: save_types.LOCAL,
                drop_event: {},
                strategy_id: null,
                showIncompatibleStrategyDialog: false,
            });
            if (load_result?.error) throw new Error(load_result.error);
            setActiveBot('best-bot', bot.id, bot.name);
            const is_protected_bot = isPremiumProtectedBot(bot.id);
            try {
                toolbar.setStrategyProtected(
                    is_protected_bot,
                    is_protected_bot ? 'This is a premium bot and cannot be downloaded.' : undefined
                );
            } catch {
                // Keep loading the bot even if toolbar protection is unavailable.
            }
            setTimeout(() => {
                const ws = window.Blockly?.derivWorkspace;
                if (ws) {
                    ws.getAllBlocks(false).forEach(block => {
                        if (
                            [
                                'before_purchase',
                                'after_purchase',
                                'during_purchase',
                                'purchase',
                                'smart_purchase_contract',
                                'trade_again',
                            ].includes(block.type)
                        ) {
                            block.setCollapsed(true);
                            if (is_protected_bot) {
                                block.contextMenu = false;
                                block.setMovable(false);
                            }
                        }
                    });
                }
            }, 500);
            setLoaded(true);
            setTimeout(() => setLoaded(false), 3000);
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch {
            setError(true);
            setTimeout(() => setError(false), 4000);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            if (!navigator.clipboard) return;
            await navigator.clipboard.writeText(bot.name);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    };

    const totalRuns = stats?.total_runs ?? 0;
    const profits = stats?.profits ?? 0;
    const losses = stats?.losses ?? 0;
    const profitAmount = stats?.profit_amount ?? 0;
    const lossAmount = stats?.loss_amount ?? 0;
    const netAmount = Number(profitAmount || 0) - Number(lossAmount || 0);
    const winRate = totalRuns > 0 ? Math.round((profits / totalRuns) * 100) : 0;
    const cardClassName = `bb-card${bot.is_premium ? ' bb-card--premium' : ''}${
        ui.is_dark_mode_on ? ' bb-card--dark' : ' bb-card--light'
    }`;

    return (
        <>
            <div className={cardClassName}>
                <div className='bb-card__header'>
                    <div className='bb-card__eyebrow-row'>
                        <span className='bb-card__eyebrow'>{cardTypeLabel}</span>
                        {bot.is_premium && <span className='bb-card__premium-badge'>Premium</span>}
                    </div>
                    <button
                        className={`bb-card__copy${copied ? ' bb-card__copy--copied' : ''}`}
                        type='button'
                        aria-label={`Copy ${bot.name}`}
                        onClick={handleCopy}
                    >
                        <span />
                        <span />
                    </button>
                </div>

                <h3 className='bb-card__name'>{bot.name}</h3>
                <p className='bb-card__desc'>{bot.description}</p>

                <div className='bb-card__performance' aria-label={`${bot.name} performance`}>
                    <div className='bb-card__metric'>
                        <strong>{totalRuns.toLocaleString()}</strong>
                        <span>Runs</span>
                    </div>
                    <div className='bb-card__metric'>
                        <strong>{winRate}%</strong>
                        <span>Win rate</span>
                    </div>
                    <div className='bb-card__metric'>
                        <strong>{profits}</strong>
                        <span>Wins</span>
                    </div>
                    <div className='bb-card__metric'>
                        <strong>{losses}</strong>
                        <span>Losses</span>
                    </div>
                </div>

                <div className='bb-card__profit-line'>
                    <span className='bb-card__profit-label'>Estimated profit</span>
                    <span className='bb-card__profit-value'>{formatMoney(netAmount)}</span>
                </div>

                <div className='bb-card__actions'>
                    {guideUrl ? (
                        <button
                            className='bb-card__guide'
                            type='button'
                            aria-label={`${bot.name} guide`}
                            onClick={toggleGuideModal}
                        >
                            <span className='bb-card__guide-icon' />
                            Guide
                        </button>
                    ) : (
                        <div className='bb-card__guide'>
                            <span className='bb-card__guide-icon' />
                            Guide
                        </div>
                    )}
                    <button
                        className={`bb-card__btn${loaded ? ' bb-card__btn--loaded' : ''}${
                            error ? ' bb-card__btn--error' : ''
                        }`}
                        onClick={handleLoad}
                        disabled={loading}
                    >
                        <span>{loading ? 'Loading...' : loaded ? 'Loaded' : error ? 'Retry' : 'Load Bot'}</span>
                        <span className='bb-card__btn-icon'>↓</span>
                    </button>
                </div>
            </div>
            {guideUrl && (
                <Modal
                    title={`${bot.name} guide`}
                    width='min(96vw, 1040px)'
                    height='min(88vh, 820px)'
                    is_open={isGuideOpen}
                    toggleModal={toggleGuideModal}
                    should_close_on_click_outside
                    is_vertical_centered
                >
                    <Modal.Body className='bb-guide-modal__body'>
                        <iframe className='bb-guide-modal__frame' src={guideUrl} title={`${bot.name} guide`} />
                        <a className='bb-guide-modal__link' href={guideUrl} target='_blank' rel='noreferrer'>
                            Open in new tab
                        </a>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
});

const BestBots = () => {
    const botsFolder = getBestBotsFolder();
    const [bots, setBots] = useState<TBot[]>([]);

    useEffect(() => {
        let isMounted = true;
        const configuredBots = getBestBotsForFolder(botsFolder);

        setBots(configuredBots);

        fetch(getBestBotsFileUrl('bots.json'))
            .then(response => {
                if (!response.ok) return [];
                return response.json();
            })
            .then((manifestBots: TBotManifestEntry[]) => {
                if (!isMounted || !Array.isArray(manifestBots)) return;
                const dynamicBots = manifestBots
                    .filter(bot => bot?.file?.toLowerCase().endsWith('.xml'))
                    .map(createManifestBot);
                const mergedBots = [...configuredBots];
                const seenFiles = new Set(mergedBots.map(bot => bot.file));

                dynamicBots.forEach(bot => {
                    if (!seenFiles.has(bot.file)) {
                        mergedBots.push(bot);
                        seenFiles.add(bot.file);
                    }
                });

                setBots(mergedBots);
            })
            .catch(() => {
                if (isMounted) setBots(configuredBots);
            });

        return () => {
            isMounted = false;
        };
    }, [botsFolder]);

    const rankedBots = [...bots].sort((a, b) => {
        const priorityA = a.priority ?? (a.is_premium ? 1 : 999);
        const priorityB = b.priority ?? (b.is_premium ? 1 : 999);
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (!!a.is_premium !== !!b.is_premium) return a.is_premium ? -1 : 1;

        const sa = HARD_CODED_STATS[a.id];
        const sb = HARD_CODED_STATS[b.id];
        const netA = Number(sa?.profit_amount || 0) - Number(sa?.loss_amount || 0);
        const netB = Number(sb?.profit_amount || 0) - Number(sb?.loss_amount || 0);
        if (netB !== netA) return netB - netA;
        const pa = sa?.profits ?? 0;
        const pb = sb?.profits ?? 0;
        if (pb !== pa) return pb - pa;
        const la = sa?.losses ?? 0;
        const lb = sb?.losses ?? 0;
        return la - lb;
    });

    return (
        <div className='best-bots'>
            <div className='best-bots__grid'>
                {rankedBots.length > 0 ? (
                    rankedBots.map((bot, index) => (
                        <BotCard
                            key={bot.id || bot.file}
                            bot={bot}
                            accent={index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'silver' : 'bronze'}
                        />
                    ))
                ) : (
                    <p>No bots configured for this domain yet.</p>
                )}
            </div>
        </div>
    );
};

export default BestBots;

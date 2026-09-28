import { useRef, useState } from 'react';
import styles from './risk-disclaimer-floating.module.scss';

const RiskDisclaimerFloating = () => {
    const [is_open, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 16, y: 16 });
    const drag = useRef({ active: false, startX: 0, startY: 0, originX: 16, originY: 16, moved: false });

    const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        drag.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            originX: position.x,
            originY: position.y,
            moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!drag.current.active) return;
        const dx = event.clientX - drag.current.startX;
        const dy = event.clientY - drag.current.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
        const width = event.currentTarget.offsetWidth;
        const height = event.currentTarget.offsetHeight;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);
        setPosition({
            x: Math.min(maxX, Math.max(8, drag.current.originX + dx)),
            y: Math.min(maxY, Math.max(8, drag.current.originY + dy)),
        });
    };

    const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
        drag.current.active = false;
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
            // Pointer capture may already have been released.
        }
    };

    const onTriggerClick = () => {
        if (!drag.current.moved) setIsOpen(true);
        drag.current.moved = false;
    };

    return (
        <>
            <button
                className={styles.trigger}
                style={{ left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onTriggerClick}
                type='button'
            >
                <span className={styles.icon}>!</span>
                <span>Risk Disclaimer</span>
            </button>

            {is_open && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div
                        className={styles.modal}
                        onClick={event => event.stopPropagation()}
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='risk-disclaimer-title'
                    >
                        <div className={styles.header}>
                            <div className={styles.badge}>!</div>
                            <h3 className={styles.title} id='risk-disclaimer-title'>
                                Risk Disclaimer
                            </h3>
                            <button
                                className={styles.close}
                                onClick={() => setIsOpen(false)}
                                type='button'
                                aria-label='Close risk disclaimer'
                            >
                                x
                            </button>
                        </div>

                        <div className={styles.body}>
                            <p>
                                Deriv offers complex derivatives, such as options and contracts for difference
                                (&ldquo;CFDs&rdquo;). These products may not be suitable for all clients, and trading
                                them puts you at risk. Please make sure that you understand the following risks before
                                trading Deriv products:
                            </p>
                            <ul className={styles.list}>
                                <li>You may lose some or all of the money you invest in the trade.</li>
                                <li>
                                    If your trade involves currency conversion, exchange rates will affect your profit
                                    and loss.
                                </li>
                                <li>
                                    You should never trade with borrowed money or with money that you cannot afford to
                                    lose.
                                </li>
                            </ul>
                        </div>

                        <div className={styles.footer}>
                            <button className={styles.confirm} onClick={() => setIsOpen(false)} type='button'>
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RiskDisclaimerFloating;

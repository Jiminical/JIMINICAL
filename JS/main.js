document.documentElement.classList.add('has-js');
window.__gdkSkipIntro = new URLSearchParams(location.search).has('skipIntro');
if (window.__gdkSkipIntro) document.documentElement.classList.add('skip-intro');
window.__gdkOpeningFailsafe = setTimeout(() => {
    if (!document.body) return;
    document.body.classList.remove('is-locked');
    document.body.classList.add('site-ready');
    document.querySelector('.opening-sequence')?.classList.add('is-complete');
    document
        .querySelectorAll('.site-header,main,.company-footer')
        .forEach((target) => (target.inert = false));
    const mobile = document.querySelector('.mobile-nav');
    if (mobile) mobile.inert = true;
}, 5200);

document.body.classList.add(window.__gdkSkipIntro ? 'site-ready' : 'is-locked');

const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const initialHash = navigationType === 'reload' ? '' : location.hash;
history.scrollRestoration = 'manual';
if (navigationType === 'reload' && location.hash)
    history.replaceState(null, '', location.pathname + location.search);
if (!initialHash) scrollTo(0, 0);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const opening = document.querySelector('.opening-sequence');

// Reset any transient animation state that may have been captured when
// the HTML was saved from DevTools or restored from the back-forward cache.
if (opening && !window.__gdkSkipIntro) {
    document.body.classList.remove('site-ready');
    document.body.classList.add('is-locked');
    opening.classList.remove('is-running', 'is-exiting', 'is-complete');
    opening.setAttribute('aria-hidden', 'false');
    const openingCounter = opening.querySelector('.opening-sequence__status b');
    if (openingCounter) openingCounter.textContent = '000';
}

const introTargets = [
    document.querySelector('.site-header'),
    document.querySelector('.mobile-nav'),
    document.querySelector('main'),
    document.querySelector('.company-footer'),
].filter(Boolean);
introTargets.forEach((target) => (target.inert = true));
let openingComplete = false;
const completeOpening = () => {
    if (openingComplete) return;
    openingComplete = true;
    clearTimeout(window.__gdkOpeningFailsafe);
    document.body.classList.remove('is-locked');
    document.body.classList.add('site-ready');
    opening?.classList.add('is-complete');
    opening?.setAttribute('aria-hidden', 'true');
    introTargets.forEach((target) => (target.inert = false));
    const closedMobileNav = document.querySelector('.mobile-nav');
    if (closedMobileNav) closedMobileNav.inert = true;
    const target = initialHash && document.querySelector(initialHash);
    requestAnimationFrame(() =>
        target ? target.scrollIntoView({ block: 'start' }) : scrollTo(0, 0)
    );
};
const playOpening = () => {
    if (!opening || reduceMotion) {
        completeOpening();
        return;
    }

    // Force a clean style frame before adding the running class so CSS
    // animations reliably restart on refresh and local file previews.
    opening.classList.remove('is-running', 'is-exiting', 'is-complete');
    void opening.offsetWidth;
    opening.classList.add('is-running');
    const counter = opening.querySelector('.opening-sequence__status b');
    const started = performance.now();
    const tick = (now) => {
        const progress = Math.min((now - started) / 3200, 1);
        if (counter) {
            counter.textContent = String(Math.round(progress * 100)).padStart(3, '0');
        }
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => {
        opening.classList.add('is-exiting');
        document.body.classList.add('site-ready');
        document.body.classList.remove('is-locked');
    }, 3380);
    setTimeout(completeOpening, 4480);
};
opening?.querySelector('.opening-sequence__skip')?.addEventListener('click', () => {
    opening.classList.add('is-exiting');
    document.body.classList.add('site-ready');
    document.body.classList.remove('is-locked');
    setTimeout(completeOpening, 980);
});
if (window.__gdkSkipIntro || !opening) {
    completeOpening();
} else {
    requestAnimationFrame(() => requestAnimationFrame(playOpening));
}

const soundTrack = document.querySelector('.sound-archive__track');
const soundCards = [...document.querySelectorAll('.sound-card')];
const soundCount = document.querySelector('.sound-archive__count');
const soundProgress = document.querySelector('.sound-archive__foot b');
let activeSound = 0;
const youtubeId = (value) => {
    const source = String(value || '').trim();
    if (!source || source.startsWith('VIDEO_ID_')) return '';
    const match = source.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))?([A-Za-z0-9_-]{11})(?:[?&/#]|$)/
    );
    return match?.[1] || '';
};
const updateSound = (index) => {
    activeSound = Math.max(0, Math.min(soundCards.length - 1, index));
    soundCount.textContent = `${String(activeSound + 1).padStart(2, '0')} / ${String(soundCards.length).padStart(2, '0')}`;
    soundProgress.style.scale = `${(activeSound + 1) / soundCards.length} 1`;
};
const goToSound = (index) => {
    const next = (index + soundCards.length) % soundCards.length;
    const left = soundCards[next].offsetLeft - soundTrack.offsetLeft;
    soundTrack.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    updateSound(next);
};
document
    .querySelector('.sound-prev')
    ?.addEventListener('click', () => goToSound(activeSound - 1));
document
    .querySelector('.sound-next')
    ?.addEventListener('click', () => goToSound(activeSound + 1));
soundTrack?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToSound(activeSound - 1);
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToSound(activeSound + 1);
    }
});
// Inline YouTube playback inside the selected card.
// Production pages must be served over HTTPS so the browser can send
// YouTube the required HTTP Referer/client identity.
let activeInlineMedia = null;

const stopInlineVideo = () => {
    if (!activeInlineMedia) return;
    activeInlineMedia.classList.remove('is-playing');
    activeInlineMedia.querySelector('.sound-card__inline-player')?.remove();
    activeInlineMedia = null;
};

const playInlineVideo = (media, id, watchUrl) => {
    stopInlineVideo();

    // A public deployment (https://) supports inline YouTube playback.
    // A raw file:// preview cannot supply YouTube's required client identity.
    if (!/^https?:$/.test(location.protocol)) {
        location.assign(watchUrl);
        return;
    }

    media.classList.add('is-playing');
    const player = document.createElement('div');
    player.className = 'sound-card__inline-player';

    const iframe = document.createElement('iframe');
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        playsinline: '1',
        controls: '1',
        rel: '0',
        enablejsapi: '1',
        origin: location.origin,
        widget_referrer: location.href,
    });
    iframe.src = `https://www.youtube.com/embed/${id}?${params.toString()}`;
    iframe.title = 'YouTube video player';
    iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;

    const external = document.createElement('a');
    external.className = 'sound-card__player-external mono';
    external.href = watchUrl;
    external.target = '_self';
    external.textContent = 'YOUTUBE ↗';

    const close = document.createElement('button');
    close.className = 'sound-card__player-close mono';
    close.type = 'button';
    close.textContent = 'BACK ×';
    close.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        stopInlineVideo();
    });

    player.append(iframe, external, close);
    media.appendChild(player);
    activeInlineMedia = media;
};

soundCards.forEach((card) => {
    const id = youtubeId(card.dataset.youtube);
    const media = card.querySelector('.sound-card__media');
    if (!media) return;

    const screen = media.querySelector('.sound-card__screen');
    if (!id) {
        media.removeAttribute('href');
        media.setAttribute('aria-disabled', 'true');
        if (screen) screen.textContent = 'YOUTUBE / LINK PENDING';
        return;
    }

    const watchUrl = `https://www.youtube.com/watch?v=${id}`;
    card.classList.add('has-video');
    card.style.setProperty(
        '--youtube-thumb',
        `url("https://i.ytimg.com/vi/${id}/maxresdefault.jpg")`
    );
    media.href = watchUrl;
    media.target = '_self';
    media.rel = 'noopener';
    media.setAttribute(
        'aria-label',
        `${media.getAttribute('aria-label') || '영상'} — 카드 안에서 재생`
    );
    if (screen) screen.textContent = 'PLAY INLINE';

    media.addEventListener('click', (event) => {
        if (
            event.target.closest(
                '.sound-card__player-close, .sound-card__player-external'
            )
        )
            return;
        event.preventDefault();
        playInlineVideo(media, id, watchUrl);
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') stopInlineVideo();
});

let soundRaf = 0;
soundTrack?.addEventListener(
    'scroll',
    () => {
        cancelAnimationFrame(soundRaf);
        soundRaf = requestAnimationFrame(() => {
            let closest = 0;
            let distance = Infinity;
            soundCards.forEach((card, index) => {
                const next = Math.abs(
                    card.offsetLeft - soundTrack.offsetLeft - soundTrack.scrollLeft
                );
                if (next < distance) {
                    distance = next;
                    closest = index;
                }
            });
            updateSound(closest);
        });
    },
    { passive: true }
);
let dragPointerId = null;
let dragStart = 0;
let dragScroll = 0;
soundTrack?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    if (
        event.target.closest(
            'a, button, iframe, input, textarea, select, [role="button"]'
        )
    )
        return;
    dragPointerId = event.pointerId;
    dragStart = event.clientX;
    dragScroll = soundTrack.scrollLeft;
    soundTrack.setPointerCapture(event.pointerId);
});
soundTrack?.addEventListener('pointermove', (event) => {
    if (event.pointerId !== dragPointerId) return;
    soundTrack.scrollLeft = dragScroll - (event.clientX - dragStart);
});
const endSoundDrag = (event) => {
    if (event.pointerId !== dragPointerId) return;
    if (soundTrack.hasPointerCapture(event.pointerId)) {
        soundTrack.releasePointerCapture(event.pointerId);
    }
    dragPointerId = null;
};
soundTrack?.addEventListener('pointerup', endSoundDrag);
soundTrack?.addEventListener('pointercancel', endSoundDrag);

document
    .querySelectorAll('.artist__visual>img[data-image-slot^="group-"]')
    .forEach((image) => {
        const visual = image.closest('.artist__visual');
        const markMissing = () => {
            image.hidden = true;
            visual.classList.add('is-image-missing');
        };
        const markReady = () => {
            image.hidden = false;
            visual.classList.remove('is-image-missing');
        };
        image.addEventListener('error', markMissing);
        image.addEventListener('load', markReady);
        if (image.complete) (image.naturalWidth ? markReady : markMissing)();
    });
document.querySelectorAll('.artist').forEach((artist) => {
    const system = artist.querySelector('.artist-system');
    const info = artist.querySelector('.artist__info');
    if (system && info) info.appendChild(system);
});
const memberData = [
    [
        {
            name: '고이안',
            code: 'IAN',
            role: 'Rap · Vocal',
            birth: '2004. 02. 21 (23세)',
            color: 'Republic of Korea',
            image: 'GDK/ian.jpg',
            focal: '50% 34%',
            pos: '2%',
            bio: '슈프림 에라의 서브 보컬 겸 래퍼입니다. 날카로운 인상과 틱틱거리는 말투에 비해 내면은 연약하고 츤데레적 면모를 보유하고 있습니다(외강내유). 그룹 컨셉에 맞추어 차가운 매력을 선보이려 노력하지만 실은 인간관계를 좋아하고 타 그룹 멤버들에게 관심이 많습니다.',
        },
        {
            name: '아나이스 하쉬',
            code: 'ANAIS HARSH',
            role: 'Lead Vocal & Visual',
            birth: '2005. 08. 27 (22세)',
            color: 'Republic of Korea & France (이중국적)',
            image: 'GDK/sola.jpg',
            focal: '50% 32%',
            pos: '15%',
            bio: '슈프림 에라의 리드 보컬입니다. 이국적 아름다움을 선사하는 외모와 몸매로 대중의 눈을 사로잡습니다. 막내임에도 담담하고 의젓한 쿨데레적 성격을 보유하는 동시에 막내답게 장난기와 담담한 활발함도 보유하고 있습니다(외유내강).',
        },
        {
            name: '한다인',
            code: 'DAIN',
            role: 'Main Vocal',
            birth: '1998. 12. 11 (28세)',
            color: 'Republic of Korea',
            image: 'GDK/mica.jpg',
            focal: '50% 34%',
            pos: '28%',
            bio: '슈프림 에라의 메인 보컬이자, GDK 엔터테인먼트의 개국부터 함께한 멤버입니다. 사장 추광덕의 소꿉친구로, 그의 권유로 아이돌로 데뷔했습니다. 그룹 내에서 뿐만 아니라 엔터 전체에서 맏언니 포지션을 맡고 있습니다. 느긋하고 여유로운 성격으로, 아직 어린 느낌이 있는 멤버들을 아끼는 경향이 있습니다.',
        },
    ],
    [
        {
            name: '이가희',
            code: 'KAHEE',
            role: 'Energy · Vocal',
            birth: '2003. 04. 14',
            color: 'Republic of Korea',
            image: 'GDK/rio.jpg',
            focal: '50% 33%',
            pos: '43%',
            bio: '폭발적인 랩과 무대 장악력으로 LIVING EVER SINCE의 속도를 이끕니다.',
        },
        {
            name: '한채연',
            code: 'CHAEYEON',
            role: 'Main Vocal · Visual',
            birth: '2001. 06. 27',
            color: 'Republic of Korea',
            image: 'GDK/noah.jpg',
            focal: '50% 32%',
            pos: '52%',
            bio: '날카로운 고음과 멜로디 메이킹으로 혼란 속의 선명한 후렴을 만듭니다.',
        },
        {
            name: '안단아',
            code: 'DANA',
            role: 'Performance · Lead Vocal',
            birth: '2000. 01. 30',
            color: 'Republic of Korea',
            image: 'GDK/june.jpg',
            focal: '50% 34%',
            pos: '61%',
            bio: '정교한 움직임과 강한 리듬 감각으로 팀의 퍼포먼스를 설계합니다.',
        },
    ],
    [
        {
            name: '이모토노 린',
            code: 'IMOTONO RIN',
            role: 'Main Vocal',
            birth: '2002. 07. 23',
            color: 'Japan',
            image: 'GDK/rena.jpg',
            focal: '50% 30%',
            pos: '73%',
            bio: '우아한 음색과 카리스마로 THE LEVERSSEN의 대담한 서사를 이끕니다.',
        },
        {
            name: '모나 아인저',
            code: 'MONA EINSER',
            role: 'Sub Vocal',
            birth: '2006. 9. 30',
            color: 'Canada',
            image: 'GDK/vivi.jpg',
            focal: '50% 31%',
            pos: '84%',
            bio: '단단한 랩과 자유로운 제스처로 무대의 분위기를 단번에 전환합니다.',
        },
        {
            name: '서해인',
            code: 'HAEIN',
            role: 'Lead Vocal',
            birth: '2005. 12. 25',
            color: 'Republic of Korea',
            image: 'GDK/arin.jpg',
            focal: '50% 31%',
            pos: '96%',
            bio: '매혹적인 보컬 톤과 표현력으로 팀의 화려한 이미지를 완성합니다.',
        },
    ],
];
const allMemberCards = [...document.querySelectorAll('.member-list article')];
document.querySelectorAll('.member-list').forEach((list, groupIndex) => {
    const profile = document.createElement('section');
    profile.className = 'member-profile';
    profile.id = `member-profile-${groupIndex + 1}`;
    profile.setAttribute('aria-live', 'polite');
    profile.setAttribute('aria-hidden', 'true');
    profile.inert = true;
    profile.innerHTML = `<div class="member-profile__clip"><div class="member-profile__inner"><div class="member-profile__portrait" role="img"><img loading="lazy" alt=""></div><div class="member-profile__data"><span class="mono"></span><h4></h4><dl class="member-profile__facts"><div><dt>Position</dt><dd></dd></div><div><dt>Age</dt><dd></dd></div><div><dt>From</dt><dd></dd></div><div><dt>Group</dt><dd></dd></div></dl><p></p></div><button class="member-profile__close mono" type="button">Close ×</button></div></div>`;
    list.appendChild(profile);
    const cards = [...list.querySelectorAll('article')];
    const hideProfile = (item) => {
        item.classList.remove('is-open');
        item.setAttribute('aria-hidden', 'true');
        item.inert = true;
    };
    const closeProfile = (returnFocus = false) => {
        const selected = cards.find((card) => card.classList.contains('is-selected'));
        hideProfile(profile);
        cards.forEach((card) => {
            card.classList.remove('is-selected');
            card.setAttribute('aria-expanded', 'false');
        });
        if (returnFocus) selected?.focus();
    };
    cards.forEach((card, memberIndex) => {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute(
            'aria-label',
            `${card.querySelector('b').textContent} 프로필 열기`
        );
        card.setAttribute('aria-expanded', 'false');
        card.setAttribute('aria-controls', profile.id);
        const open = () => {
            const wasSelected = card.classList.contains('is-selected');
            document.querySelectorAll('.member-profile').forEach(hideProfile);
            allMemberCards.forEach((item) => {
                item.classList.remove('is-selected');
                item.setAttribute('aria-expanded', 'false');
            });
            if (wasSelected) return;
            const member = memberData[groupIndex][memberIndex];
            const portrait = profile.querySelector('.member-profile__portrait');
            const image = portrait.querySelector('img');
            portrait.style.setProperty('--portrait-x', member.pos);
            portrait.style.setProperty('--member-focal', member.focal);
            portrait.setAttribute('aria-label', `${member.name} 프로필 사진`);
            image.classList.remove('is-fallback');
            image.alt = `${member.name} 프로필 사진`;
            image.onerror = () => image.classList.add('is-fallback');
            image.src = member.image;
            profile.inert = false;
            profile.setAttribute('aria-hidden', 'false');
            profile.querySelector('.member-profile__data>span').textContent =
                member.code;
            profile.querySelector('h4').textContent = member.name;
            const facts = profile.querySelectorAll('dd');
            [
                member.role,
                member.birth,
                member.color,
                ['SUPREME ERA', 'LIVING EVER SINCE', 'THE LEVERSSEN'][groupIndex],
            ].forEach((value, i) => (facts[i].textContent = value));
            profile.querySelector('.member-profile__data p').textContent = member.bio;
            profile.classList.add('is-open');
            card.classList.add('is-selected');
            card.setAttribute('aria-expanded', 'true');
        };
        card.addEventListener('click', open);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
    });
    profile
        .querySelector('.member-profile__close')
        .addEventListener('click', (event) => {
            event.stopPropagation();
            closeProfile(true);
        });
});

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
        (entries) =>
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            }),
        { threshold: 0.06, rootMargin: '0px 0px 10%' }
    );
    reveals.forEach((el) => revealObserver.observe(el));
} else reveals.forEach((el) => el.classList.add('is-visible'));

const cursor = document.querySelector('.cursor');
if (cursor && matchMedia('(pointer:fine)').matches) {
    let cursorFrame = 0,
        cursorX = 0,
        cursorY = 0;
    window.addEventListener(
        'pointermove',
        (event) => {
            cursorX = event.clientX;
            cursorY = event.clientY;
            cursor.classList.add('is-visible');
            if (!cursorFrame)
                cursorFrame = requestAnimationFrame(() => {
                    cursor.style.left = cursorX + 'px';
                    cursor.style.top = cursorY + 'px';
                    cursorFrame = 0;
                });
        },
        { passive: true }
    );
    document.querySelectorAll('a,button,.artist').forEach((el) => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });
}

const hero = document.querySelector('.hero');
const heroStage = document.querySelector('.hero-v4__stage');
let heroPointerFrame = 0,
    heroPointerEvent;
hero.addEventListener(
    'pointermove',
    (event) => {
        if (reduceMotion || !matchMedia('(pointer:fine)').matches) return;
        heroPointerEvent = event;
        if (!heroPointerFrame)
            heroPointerFrame = requestAnimationFrame(() => {
                const bounds = hero.getBoundingClientRect();
                const x = (heroPointerEvent.clientX - bounds.left) / bounds.width - 0.5;
                const y = (heroPointerEvent.clientY - bounds.top) / bounds.height - 0.5;
                hero.style.setProperty('--mx', (x * 3).toFixed(2));
                hero.style.setProperty('--my', (y * 3).toFixed(2));
                heroPointerFrame = 0;
            });
    },
    { passive: true }
);
hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mx', 0);
    hero.style.setProperty('--my', 0);
});
const progress = document.querySelector('.scroll-progress');
let ticking = false;
const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${maxScroll ? scrollY / maxScroll : 0})`;
    if (!reduceMotion && scrollY < innerHeight)
        heroStage.style.translate = `0 ${scrollY * 0.045}px`;
    ticking = false;
};
addEventListener(
    'scroll',
    () => {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    },
    { passive: true }
);

const menuButton = document.querySelector('.menu');
const mobileNav = document.querySelector('.mobile-nav');
const menuBackground = [
    document.querySelector('main'),
    document.querySelector('.company-footer'),
].filter(Boolean);
const closeMenu = (returnFocus = false) => {
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileNav.inert = true;
    menuBackground.forEach((target) => (target.inert = false));
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
    menuButton.textContent = 'Menu ↗';
    document.body.classList.remove('is-locked');
    if (returnFocus) menuButton.focus();
};
menuButton.addEventListener('click', () => {
    const opening = !mobileNav.classList.contains('is-open');
    if (opening) {
        mobileNav.inert = false;
        mobileNav.classList.add('is-open');
        mobileNav.setAttribute('aria-hidden', 'false');
        menuBackground.forEach((target) => (target.inert = true));
        menuButton.setAttribute('aria-expanded', 'true');
        menuButton.setAttribute('aria-label', '메뉴 닫기');
        menuButton.textContent = 'Close ×';
        document.body.classList.add('is-locked');
        requestAnimationFrame(() => mobileNav.querySelector('a')?.focus());
    } else closeMenu();
});
mobileNav
    .querySelectorAll('a')
    .forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileNav.classList.contains('is-open'))
        closeMenu(true);
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav a,.mobile-nav a')];
const sectionObserver = new IntersectionObserver(
    (entries) =>
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    const current = link.hash === '#' + entry.target.id;
                    link.classList.toggle('is-current', current);
                    if (current) link.setAttribute('aria-current', 'page');
                    else link.removeAttribute('aria-current');
                });
            }
        }),
    { rootMargin: '-35% 0px -60%' }
);
sections.forEach((section) => sectionObserver.observe(section));

const artistSections = [...document.querySelectorAll('.artist')];
const updateArtistProgress = () =>
    artistSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = Math.max(
            0,
            Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height))
        );
        section.style.setProperty('--section-progress', progress.toFixed(3));
    });
let artistProgressFrame = 0;
if (reduceMotion)
    artistSections.forEach((section) =>
        section.style.setProperty('--section-progress', '.5')
    );
else {
    addEventListener(
        'scroll',
        () => {
            if (!artistProgressFrame)
                artistProgressFrame = requestAnimationFrame(() => {
                    updateArtistProgress();
                    artistProgressFrame = 0;
                });
        },
        { passive: true }
    );
    updateArtistProgress();
}

const motionSections = document.querySelectorAll(
    '.hero,.sound-archive,.artist,.manifesto,.fan-board,.cta'
);
const motionObserver = new IntersectionObserver(
    (entries) =>
        entries.forEach((entry) =>
            entry.target.classList.toggle('is-motion-active', entry.isIntersecting)
        ),
    { rootMargin: '15% 0px' }
);
motionSections.forEach((section) => motionObserver.observe(section));

const postDetails = [
    {
        full: '그냥 이럴거면 회사 넘기거나 팔지 ㅋㅋㅋ 세상이 치켜세워주니까 그냥 운영을 맘대로 하시네요 그렇게 할거면 차라리 망하는게 나음 ㅇㅇ',
        comments: [
            [
                '동탄신도시맥도날드감자튀김도둑',
                '1분 전',
                '얘는 딱 이창혁마냥 천재병 걸린게 맞는듯... 근데 천재도 아님',
            ],
            [
                '선혈포식자',
                '방금',
                '아니 근데 진짜 이유라도 말해줘야 납득할거 아닌가 ㅋㅋ;',
            ],
        ],
    },
    {
        full: '1년 전만해도 세상에서 제일 영리하다고 칭찬받던 사람 아닌가. 솔직히 1년만에 엔터 이렇게 키운거면 상식적으로 이런 짓 할 사람이 아닌데;',
        comments: [
            [
                '다인이누낭',
                '12분 전',
                'ㄹㅇ 뭐 이해가 안됨 그냥. 이유도 안 말해줘 복귀 시기도 안 말해줘 뭐 군대 간 남친 기다리는 것보다 더하네',
            ],
            [
                '레버센응원',
                '8분 전',
                '이 정도면 정신에 문제 생긴게 맞는듯. 애들은 다들 열심히 하려고 하던데',
            ],
        ],
    },
    {
        full: '나 관계자였다가 퇴사했는데 이 회사 돈이 없는건 아님. 그렇다고 많은 것도 아니긴 한데 솔직히 애들 활동할 정도는 되거든? 사장이랑 뭐 만나서 얘기라도 할 수가 있어야지. 회의도 안옴, 지맘대로 펑크냄',
        comments: [
            [
                '기분이조크등여',
                '35분 전',
                'ㅈㄹ하지마셈 ㅋㅋ 이거 진짜면 님 광덕엔터에서 고소먹음. 자신 있으니까 떠벌린거노?',
            ],
            [
                'LEVERERA',
                '22분 전',
                '진짜면 좀 실망이긴 하네 ㅋㅋ 비즈니스에서 회의 펑크내는거 너무 치명적인데',
            ],
        ],
    },
    {
        full: '슈프림 연기 때는 처음이고 단기적 해프닝으로 끝날줄 알았으니까 팬들이 참아준거죠... 그 때도 이유에 대해서 말 한마디 없었는데 갑자기 활동 중지는 힘이 너무 빠지네요... 사장이 탈덕하게 만듭니다',
        comments: [
            [
                '도완입수',
                '48분 전',
                '딱 한 번이라도 좋으니까 공식석상 나와서 한 마디만 해줬으면 좋겠네요',
            ],
            [
                '박강탁할아버지89세인생최후의덕질',
                '31분 전',
                'ㄹㅇ 사장이 탈덕하게 만든다는 말이 딱 맞는듯. 행보가 예측이 안됨... 곤충의 움직임임 그냥',
            ],
        ],
    },
];
const fanPosts = [...document.querySelectorAll('.fan-post')];
const setFanPostOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    const button = item.querySelector('.fan-post__toggle');
    const panel = item.querySelector('.fan-post__detail');
    button?.setAttribute('aria-expanded', String(open));
    if (panel) {
        panel.inert = !open;
        panel.setAttribute('aria-hidden', String(!open));
    }
};

fanPosts.forEach((post, index) => {
    const data = postDetails[index];
    const title = post.querySelector('h3');
    let toggleButton = post.querySelector('.fan-post__toggle');
    let detail = post.querySelector('.fan-post__detail');

    // 구버전 HTML처럼 상세 영역이 없는 게시글만 새로 생성한다.
    // 현재 HTML에 이미 존재하는 상세 영역은 그대로 재사용해 중복 생성을 막는다.
    if (!detail && data) {
        detail = document.createElement('div');
        detail.className = 'fan-post__detail';
        detail.innerHTML = `<div class="fan-post__detail-inner"><div class="fan-post__detail-content"><button class="fan-post__detail-close mono" type="button">Close ×</button><div class="fan-post__detail-head mono"><span>Full discussion</span><span>Comments / ${post.querySelector('footer span:last-child b')?.textContent || '0'}</span></div><p class="fan-post__full"></p><div class="fan-comments"></div></div></div>`;
        detail.querySelector('.fan-post__full').textContent = data.full;
        const comments = detail.querySelector('.fan-comments');
        data.comments.forEach(([author, time, copy]) => {
            const article = document.createElement('article');
            article.className = 'fan-comment';
            article.innerHTML =
                '<div class="fan-comment__author"><b></b><time></time></div><p></p>';
            article.querySelector('b').textContent = author;
            article.querySelector('time').textContent = time;
            article.querySelector('p').textContent = copy;
            comments.appendChild(article);
        });
        post.appendChild(detail);
    }

    if (!detail || !title) return;
    detail.id ||= `fan-post-detail-${index + 1}`;
    detail.setAttribute('aria-hidden', 'true');
    detail.inert = true;

    if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.className = 'fan-post__toggle';
        toggleButton.type = 'button';
        title.replaceWith(toggleButton);
        toggleButton.appendChild(title);
    }

    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', detail.id);
    toggleButton.setAttribute('aria-label', `${title.textContent} 상세 보기`);

    detail.addEventListener('click', (event) => event.stopPropagation());
    const toggle = () => {
        const opening = !post.classList.contains('is-open');
        fanPosts.forEach((item) => setFanPostOpen(item, false));
        if (opening) setFanPostOpen(post, true);
    };

    post.addEventListener('click', (event) => {
        if (!event.target.closest('.fan-post__detail,.fan-post__toggle')) toggle();
    });
    toggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle();
    });
    detail.querySelector('.fan-post__detail-close')?.addEventListener('click', () => {
        setFanPostOpen(post, false);
        toggleButton.focus();
    });
});

const dialog = document.querySelector('.news-detail');
let newsCloseTimer = 0;
const closeDialog = ({ immediate = false } = {}) => {
    if (!dialog?.open) return;
    clearTimeout(newsCloseTimer);
    dialog.classList.remove('is-visible');
    const finish = () => {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    };
    if (immediate || reduceMotion) finish();
    else newsCloseTimer = window.setTimeout(finish, 420);
};
const openNewsDialog = (item) => {
    clearTimeout(newsCloseTimer);
    if (!dialog || !item) return;
    const dateTarget = dialog.querySelector('.news-detail__date');
    const titleTarget = dialog.querySelector('.news-detail__title');
    const copyTarget = dialog.querySelector('.news-detail__copy');
    const itemTime = item.querySelector('time')?.textContent?.trim() || '';
    const itemTitle = item.querySelector('h3')?.textContent?.trim() || 'GDK NEWS';
    if (dateTarget)
        dateTarget.textContent = itemTime ? `${itemTime} / GDK NEWS` : 'GDK NEWS';
    if (titleTarget) titleTarget.textContent = itemTitle;
    if (copyTarget) copyTarget.textContent = item.dataset.copy || '';
    if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
    }
    requestAnimationFrame(() =>
        requestAnimationFrame(() => dialog.classList.add('is-visible'))
    );
};
document
    .querySelectorAll('.news-item')
    .forEach((item) => item.addEventListener('click', () => openNewsDialog(item)));
dialog?.querySelector('button')?.addEventListener('click', () => closeDialog());
dialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
});
dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
});

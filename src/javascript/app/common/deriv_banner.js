const Cookies        = require('js-cookie');
const getElementById = require('../../_common/common_functions').getElementById;
const createElement  = require('../../_common/utility').createElement;
const getLanguage       = require('../../_common/language').get;

const banner_types = {
    rebranding: 'rebranding',
    multiplier: 'multiplier',
};
const affiliate_token = Cookies.getJSON('affiliate_tracking');

const DerivBanner = (() => {
    let el_rebranding_banner_container,
        el_multiplier_banner_container,
        el_banner_to_show,
        el_close_button,
        deriv_banner_type,
        banner_link,
        multiplier_link;

    const onLoad = () => {
        const is_deriv_banner_dismissed = localStorage.getItem('is_deriv_banner_dismissed');

        if (!is_deriv_banner_dismissed) {
            el_rebranding_banner_container = getElementById('deriv_banner_container');
            el_multiplier_banner_container = getElementById('multiplier_banner_container');
            deriv_banner_type = localStorage.getItem('deriv_banner_type');
            banner_link = getElementById('banner-link');
            multiplier_link = getElementById('multiplier-link');

            const lang = getLanguage().toLowerCase();
            const banner_href = `https://deriv.com/${lang}/interim/faq/?utm_source=binary&utm_medium=referral&utm_campaign=ww-banner-deriv-1020-en&utm_content=deriv-banner-rebranding`;
            const multiplier_href = `https://deriv.com/${lang}/trade-types/multiplier/?utm_source=binary&utm_medium=referral&utm_campaign=ww-banner-deriv-1020-en&utm_content=multiplier-banner-synthetic-indices-amplified`;

            banner_link.href = affiliate_token ? `${banner_href}&t=${affiliate_token.t}` : banner_href;
            multiplier_link.href = affiliate_token ? `${multiplier_href}&t=${affiliate_token.t}` : multiplier_href;

            showBanner();

            el_close_button = el_banner_to_show.querySelector('.deriv_banner_close') || createElement('div');
            el_close_button.addEventListener('click', onClose);
        }
    };

    const onClose = () => {
        el_banner_to_show.setVisibility(0);
        localStorage.setItem('is_deriv_banner_dismissed', 1);
    };

    const showBanner = () => {
        if (deriv_banner_type === banner_types.rebranding) {
            el_banner_to_show = el_rebranding_banner_container;
        } else {
            el_banner_to_show = el_multiplier_banner_container;
        }
        el_banner_to_show.setVisibility(1);
    };

    const chooseBanner = () => {
        if (localStorage.getItem('deriv_banner_type')) {
            return;
        }

        const banner_type = Math.random() < 0.5 ? banner_types.rebranding : banner_types.multiplier;

        localStorage.setItem('deriv_banner_type', banner_type);
    };

    const onUnload = () => {
        if (el_close_button) {
            el_close_button.removeEventListener('click', onClose);
        }
    };

    return {
        chooseBanner,
        onLoad,
        onUnload,
    };
})();

module.exports = DerivBanner;

import { Diary } from "letterboxd-api";

const REVIEW_CHARS = 75;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December',
];

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#raw_strings
const html = (strings: TemplateStringsArray, ...values: any) => String.raw({ raw: strings }, ...values);

export default function diaryView(diaryList: Diary[], username: string): string {
    return html`

<style>
    #letterboxd-embed-tc {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        font-size: 1rem;
    }

    .letterboxd-embed-tc-diary-entry {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .letterboxd-embed-tc-title {
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 0.1rem;
    }

    .letterboxd-embed-tc-date {
        font-size: 0.9rem;
        margin-bottom: 0.1rem;
    }

    .letterboxd-embed-tc-rating {
        color: #086a00;
        font-size: 1.2rem;
    }

    .letterboxd-embed-tc-review {
        margin-top: 0.2rem;
        font-size: 0.8rem;
        color: #555;
    }

    .letterboxd-embed-tc-divider {
        border-bottom: 1px solid #e6e6e6;
    }

    .letterboxd-embed-tc-poster img {
        border-radius: 0.25rem;
    }

    .letterboxd-embed-tc-content {
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }
</style>

<div id="letterboxd-embed-tc">
    ${diaryList.map((diary, idx) => {
        const date = new Date(diary.date.watched);
        const dateString = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

        const review = diary.review
            ? diary.review.substring(0, REVIEW_CHARS) + (diary.review.length > REVIEW_CHARS 
                ? '[<a href="' + diary.uri + '">more</a>]' 
                : '')
            : '';

        return `
        <div class="letterboxd-embed-tc-diary-entry">
            <div class="letterboxd-embed-tc-content">
                <div class="letterboxd-embed-tc-poster">
                    <a href="${diary.uri}">
                        <img src="${diary.film?.image?.small ?? ''}" alt="${diary.film.title} poster">
                    </a>
                </div>

                <div>
                    <div class="letterboxd-embed-tc-title">${diary.film.title} (${diary.film.year})</div>

                    <div class="letterboxd-embed-tc-date">${diary.isRewatch ? '&#9850;' : ''} ${dateString}</div>

                    <div class="letterboxd-embed-tc-rating">${diary.rating.text ?? ''}</div>

                    ${review ? `
                        <div class="letterboxd-embed-tc-review">${review}</div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="letterboxd-embed-tc-divider"></div>
    `}).join('')}

    <div class="letterboxd-embed-tc-more">
        <a href="https://letterboxd.com/${username}">...more on Letterboxd</a>
    </div>
</div>
`;
}
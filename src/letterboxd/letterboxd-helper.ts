import letterboxd, { Diary, Letterboxd } from "letterboxd-api";
import diaryView from "../../views/diary";

import TEST_DATA from './test-diary.json';

const DIARY_LIMIT = 5;

export async function getHtml(username: string, test: boolean): Promise<string> {
    const {diaryEntries, error} = await getDiaryEntries(username, test);

    return error || diaryView(diaryEntries, username);
}

export async function getRaw(username: string): Promise<object> {
    return await letterboxd(username);
}

async function getDiaryEntries(
    username: string, 
    test: boolean
): Promise<{diaryEntries: Diary[], error: string|null}> {
    let entries: Letterboxd[];

    try {
        entries = !test ? await letterboxd(username) : <Letterboxd[]>TEST_DATA;
    } catch (error) {
        console.error(error);

        if (error instanceof Error) {
            return {diaryEntries: [], error: error.message};
        } else {
            return {diaryEntries: [], error: "Unknown error"};
        }
    }

    const filtered: Diary[] = <Diary[]>entries.filter((entry) => entry.type === "diary");

    return {
        diaryEntries: filtered.slice(0, DIARY_LIMIT),
        error: null,
    };
}

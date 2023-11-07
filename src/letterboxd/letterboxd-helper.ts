import letterboxd, { Diary, Letterboxd } from "letterboxd-api";
import diaryView from "../../views/diary";

import TEST_DATA from './test-diary.json';

const DIARY_LIMIT = 5;

export async function getHtml(username: string, test: boolean): Promise<string|null> {
    const diaryEntries: Diary[]|null = await getDiaryEntries(username, test);

    return diaryEntries ? diaryView(diaryEntries, username) : null;
}

export async function getRaw(username: string): Promise<object> {
    return await letterboxd(username);
}

async function getDiaryEntries(username: string, test: boolean): Promise<Diary[]|null> {
    let entries: Letterboxd[];

    try {
        entries = !test ? await letterboxd(username) : <Letterboxd[]>TEST_DATA;
    } catch (error) {
        return null;
    }

    const diaryEntries: Diary[] = <Diary[]>entries.filter((entry) => entry.type === "diary");

    return diaryEntries.slice(0, DIARY_LIMIT);
}

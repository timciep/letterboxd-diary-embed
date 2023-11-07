import letterboxd, { Diary, Letterboxd } from "letterboxd-api";
import diaryView from "../../views/diary";

import TEST_DATA from './test-diary.json';

const DIARY_LIMIT = 5;

export async function getHtml(username: string, test: boolean): Promise<string> {
    const diaryEntries: Diary[] = await getDiaryEntries(username, test);

    return diaryView(diaryEntries, username);
}

export async function getRaw(username: string): Promise<object> {
    return await letterboxd(username);
}

async function getDiaryEntries(username: string, test: boolean): Promise<Diary[]> {
    const entries: Letterboxd[] = !test ? await letterboxd(username) : <Letterboxd[]>TEST_DATA;

    const diaryEntries: Diary[] = <Diary[]>entries.filter((entry) => entry.type === "diary");

    return diaryEntries.slice(0, DIARY_LIMIT);
}

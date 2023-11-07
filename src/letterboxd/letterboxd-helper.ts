import letterboxd, { Diary, Letterboxd } from "letterboxd-api";
import diaryView from "../../views/diary";

import TEST_DATA from './test-diary.json';

export async function getHtml(username: string, test: boolean): Promise<string> {
    const diaryEntries: Diary[] = await getDiaryEntries(username, test);

    return diaryView(diaryEntries, username);
}

async function getDiaryEntries(username: string, test: boolean): Promise<Diary[]> {
    const entries: Letterboxd[] = !test ? await letterboxd(username) : <Letterboxd[]>TEST_DATA;

    const diaryEntries: Diary[] = <Diary[]>entries.filter((entry) => entry.type === "diary");

    return diaryEntries;
}

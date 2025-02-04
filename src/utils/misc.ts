import axios from "axios";

export const HIDE_NAVBAR_PAGES = ["fancy-pants"];
const BUTTONDOWN_URL = "https://api.buttondown.email/v1/subscribers";
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;

/**
 * @param path page pathname without initial slash
 */
export const checkIfNavbarShouldBeHidden = (path: string) => HIDE_NAVBAR_PAGES.includes(path);

type TButtondownSubscribersAPIResponseObject = {
	count: number;
	next: null;
	previous: null;
	results: Array<{
		creation_date: string;
		email: string;
		id: string;
		notes: string;
		referrer_url: string;
		metadata: Record<string, unknown>;
		secondary_id: number;
		subscriber_type: string;
		source: string;
		tags: Array<string>;
		utm_campaign: string;
		utm_medium: string;
		utm_source: string;
	}>;
};

export const getButtondownSubscriberCount = async () => {
	const BUTTONDOWN_AUTH_TOKEN = `Token ${BUTTONDOWN_API_KEY}`;

	try {
		return (
			(
				await axios.get(BUTTONDOWN_URL, {
					headers: { Authorization: BUTTONDOWN_AUTH_TOKEN },
				})
			).data as TButtondownSubscribersAPIResponseObject
		).count;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error({ error });
		return 0;
	}
};

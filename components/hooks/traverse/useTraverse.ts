import { useEffect, useState } from "react";
import { CommunityView } from "lemmy-js-client";
import { lemmyAuthToken, lemmyInstance } from "../../../lemmy/LemmyInstance";
import { writeToLog } from "../../../helpers/LogHelper";
import { useAppSelector } from "../../../store";
import { selectCurrentAccount } from "../../../slices/accounts/accountsSlice";

interface UseTraverse {
  loading: boolean;
  error: boolean;
  refreshing: boolean;

  doLoad: (refresh?: boolean) => Promise<void>;

  subscriptions: CommunityView[];
}

const useTraverse = (): UseTraverse => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [subscriptions, setSubscriptions] = useState<CommunityView[]>([]);

  const currentAccount = useAppSelector(selectCurrentAccount);

  useEffect(() => {
    doLoad().then();
  }, [currentAccount]);

  const doLoad = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    const res = await getAllCommunities();

    setLoading(false);
    setRefreshing(false);

    if (!res) {
      setError(true);
      return;
    }

    setSubscriptions(res as CommunityView[]);
  };

  const getSubscriptions = async (page): Promise<boolean | CommunityView[]> => {
    try {
      const res = await lemmyInstance.listCommunities({
        auth: lemmyAuthToken,
        type_: "Subscribed",
        limit: 50,
        page,
      });

      return res.communities;
    } catch (e) {
      writeToLog("Failed to load communities.");
      writeToLog(e.toString());

      return false;
    }
  };

  const getAllCommunities = async (): Promise<CommunityView[] | boolean> => {
    let communities: CommunityView[] = [];
    let page = 1;

    while (communities.length % 50 === 0) {
      // eslint-disable-next-line no-await-in-loop
      const res = await getSubscriptions(page);

      if (!res) return false;

      if ((res as CommunityView[]).length === 0) {
        break;
      }

      communities = [...communities, ...(res as CommunityView[])];
      page += 1;
    }

    return communities.sort((a, b) =>
      a.community.name.localeCompare(b.community.name)
    );
  };

  return {
    loading,
    error,
    refreshing,

    doLoad,

    subscriptions,
  };
};

export default useTraverse;

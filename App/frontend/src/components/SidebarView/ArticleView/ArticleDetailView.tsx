import * as React from "react";
import {
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Button,
  tokens,
  makeStyles,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { getArticleDetails } from "../../../api/api";
import { get } from "lodash";

// Define an interface for ArticleDetails
interface ArticleDetails {
    title: string;
    content: string;
    // Add other properties if needed
}

const useStyles = makeStyles({
  main: {
    display: "grid",
    justifyContent: "flex-start",
    gridRowGap: tokens.spacingVerticalXXL,
  },

  field: {
    display: "grid",
    gridRowGap: tokens.spacingVerticalS,
  },
});


export const ArticlesDetailView = () => {
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const [articleDetails, setArticleDetails] = React.useState({
    "title": "",
    "content": "",
  });

  const onOpen = async () => {
    setOpen(true);
    const response = await getArticleDetails("38166157_01");

    if (!response || response.status !== 200) {
      console.error("Failed to fetch article details");
      return;
    }

    const articleDetails = await response.json();

    setArticleDetails(articleDetails || {
      "title": "",
      "content": "",
    });
  }

  return (
    <div>
      <OverlayDrawer
        size="medium"
        position="end"
        open={open}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={() => setOpen(false)}
              />
            }
          >
            {articleDetails["title"]}
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          <p>{articleDetails["content"]}</p>
        </DrawerBody>
      </OverlayDrawer>

      <div className={styles.main}>
        <Button appearance="primary" onClick={() => onOpen() }>
          Open
        </Button>
      </div>
    </div>
  );
};

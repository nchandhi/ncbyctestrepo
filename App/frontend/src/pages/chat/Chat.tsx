import { useRef, useState, useEffect, useContext, useLayoutEffect } from "react";
import { CommandBarButton, IconButton, Dialog, DialogType, Stack, Icon } from "@fluentui/react";
import { DefaultButton as FluentButton } from '@fluentui/react/lib/Button';
import { Text } from "@fluentui/react";
import { SquareRegular, ShieldLockRegular, ErrorCircleRegular } from "@fluentui/react-icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import rehypeRaw from "rehype-raw";
import uuid from 'react-uuid';
import { isEmpty } from "lodash-es";

import styles from "./Chat.module.css";
import Azure from "../../assets/Azure.svg";

import {
    ChatMessage,
    ConversationRequest,
    conversationApi,
    Citation,
    ToolMessageContent,
    ChatResponse,
    getUserInfo,
    Conversation,
    historyGenerate,
    historyUpdate,
    historyClear,
    ChatHistoryLoadingState,
    CosmosDBStatus,
    ErrorMessage
} from "../../api";
import { Answer } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ChatHistoryPanel } from "../../components/ChatHistory/ChatHistoryPanel";
import { AppStateContext } from "../../state/AppProvider";
import { useBoolean } from "@fluentui/react-hooks";
import { SidebarOptions } from "../../components/SidebarView/SidebarView";

const enum messageStatus {
    NotRunning = "Not Running",
    Processing = "Processing",
    Done = "Done"
}

interface Props {
    chatType: SidebarOptions | null | undefined;
}

const Chat = ({ chatType }: Props) => {
    const appStateContext = useContext(AppStateContext)
    const AUTH_ENABLED = appStateContext?.state.frontendSettings?.auth_enabled === "true" ;
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showLoadingMessage, setShowLoadingMessage] = useState<boolean>(false);
    const [activeCitation, setActiveCitation] = useState<Citation>();
    const [isCitationPanelOpen, setIsCitationPanelOpen] = useState<boolean>(false);
    const abortFuncs = useRef([] as AbortController[]);
    const [showAuthMessage, setShowAuthMessage] = useState<boolean>(true);
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [processMessages, setProcessMessages] = useState<messageStatus>(messageStatus.NotRunning);
    const [clearingChat, setClearingChat] = useState<boolean>(false);
    const [hideErrorDialog, { toggle: toggleErrorDialog }] = useBoolean(true);
    const [errorMsg, setErrorMsg] = useState<ErrorMessage | null>()

    const errorDialogContentProps = {
        type: DialogType.close,
        title: errorMsg?.title,
        closeButtonAriaLabel: 'Close',
        subText: errorMsg?.subtitle,
    };

    const modalProps = {
        titleAriaId: 'labelId',
        subtitleAriaId: 'subTextId',
        isBlocking: true,
        styles: { main: { maxWidth: 450 } },
    }

    const [ASSISTANT, TOOL, ERROR] = ["assistant", "tool", "error"]

    const handleErrorDialogClose = () => {
        toggleErrorDialog()
        setTimeout(() => {
            setErrorMsg(null)
        }, 500);
    }

    useEffect(() => {
       setIsLoading(appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading)
    }, [appStateContext?.state.chatHistoryLoadingState])

    const getUserInfoList = async () => {
        if (!AUTH_ENABLED) {
            setShowAuthMessage(false);
            return;
        }
        const userInfoList = await getUserInfo();
        if (userInfoList.length === 0 && window.location.hostname !== "127.0.0.1") {
            setShowAuthMessage(true);
        }
        else {
            setShowAuthMessage(false);
        }
    }

    let assistantMessage = {} as ChatMessage
    let toolMessage = {} as ChatMessage
    let assistantContent = ""

    const processResultMessage = (resultMessage: ChatMessage, userMessage: ChatMessage, conversationId?: string) => {
        if (resultMessage.role === ASSISTANT) {
            assistantContent += resultMessage.content
            assistantMessage = resultMessage
            assistantMessage.content = assistantContent
        }

        if (resultMessage.role === TOOL) toolMessage = resultMessage

        if (!conversationId) {
            isEmpty(toolMessage) ?
                setMessages([...messages, userMessage, assistantMessage]) :
                setMessages([...messages, userMessage, toolMessage, assistantMessage]);
        } else {
            isEmpty(toolMessage) ?
                setMessages([...messages, assistantMessage]) :
                setMessages([...messages, toolMessage, assistantMessage]);
        }
    }

    const makeApiRequestWithoutCosmosDB = async (question: string, conversationId?: string) => {
        setIsLoading(true);
        setShowLoadingMessage(true);
        const abortController = new AbortController();
        abortFuncs.current.unshift(abortController);

        const userMessage: ChatMessage = {
            id: uuid(),
            role: "user",
            content: question,
            date: new Date().toISOString(),
        };

        let conversation: Conversation | null | undefined;
        if(!conversationId){
            conversation = {
                id: conversationId ?? uuid(),
                title: question,
                messages: [userMessage],
                date: new Date().toISOString(),
            }
        }else{
            conversation = appStateContext?.state?.currentChat
            if(!conversation){
                console.error("Conversation not found.");
                setIsLoading(false);
                setShowLoadingMessage(false);
                abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                return;
            }else{
                conversation.messages.push(userMessage);
            }
        }

        appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: conversation });
        setMessages(conversation.messages)
        
        const request: ConversationRequest = {
            messages: [...conversation.messages.filter((answer) => answer.role !== ERROR)],
            index_name: String(appStateContext?.state.sidebarSelection)
        };

        let result = {} as ChatResponse;
        try {
            const response = await conversationApi(request, abortController.signal);
            if (response?.body) {
                const reader = response.body.getReader();
                let runningText = "";

                while (true) {
                    setProcessMessages(messageStatus.Processing)
                    const {done, value} = await reader.read();
                    if (done) break;

                    var text = new TextDecoder("utf-8").decode(value);
                    const objects = text.split("\n");
                    objects.forEach((obj) => {
                        try {
                            runningText += obj;
                            result = JSON.parse(runningText);
                            result.choices[0].messages.forEach((obj) => {
                                obj.id = uuid();
                                obj.date = new Date().toISOString();
                            })
                            setShowLoadingMessage(false);
                            result.choices[0].messages.forEach((resultObj) => {
                                processResultMessage(resultObj, userMessage, conversationId);
                            })
                            runningText = "";
                        }
                        catch { }
                    });
                }
                conversation.messages.push(toolMessage, assistantMessage)
                appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: conversation });
                setMessages([...messages, toolMessage, assistantMessage]);
            }
            
        } catch ( e )  {
            if (!abortController.signal.aborted) {
                let errorMessage = "An error occurred. Please try again. If the problem persists, please contact the site administrator.";
                if (result.error?.message) {
                    errorMessage = result.error.message;
                }
                else if (typeof result.error === "string") {
                    errorMessage = result.error;
                }
                let errorChatMsg: ChatMessage = {
                    id: uuid(),
                    role: ERROR,
                    content: errorMessage,
                    date: new Date().toISOString()
                }
                conversation.messages.push(errorChatMsg);
                appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: conversation });
                setMessages([...messages, errorChatMsg]);
            } else {
                setMessages([...messages, userMessage])
            }
        } finally {
            setIsLoading(false);
            setShowLoadingMessage(false);
            abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
            setProcessMessages(messageStatus.Done)
        }

        return abortController.abort();
    };

    const makeApiRequestWithCosmosDB = async (question: string, conversationId?: string) => {
        setIsLoading(true);
        setShowLoadingMessage(true);
        const abortController = new AbortController();
        abortFuncs.current.unshift(abortController);

        const userMessage: ChatMessage = {
            id: uuid(),
            role: "user",
            content: question,
            date: new Date().toISOString(),
        };

        //api call params set here (generate)
        let request: ConversationRequest;
        let conversation;
        if(conversationId){
            conversation = appStateContext?.state?.chatHistory?.find((conv) => conv.id === conversationId)
            if(!conversation){
                console.error("Conversation not found.");
                setIsLoading(false);
                setShowLoadingMessage(false);
                abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                return;
            }else{
                conversation.messages.push(userMessage);
                request = {
                    messages: [...conversation.messages.filter((answer) => answer.role !== ERROR)],
                    index_name: String(appStateContext?.state.sidebarSelection)
                };
            }
        }else{
            request = {
                messages: [userMessage].filter((answer) => answer.role !== ERROR),
                index_name: String(appStateContext?.state.sidebarSelection)
            };
            setMessages(request.messages)
        }
        let result = {} as ChatResponse;
        try {
            const response = conversationId ? await historyGenerate(request, abortController.signal, conversationId) : await historyGenerate(request, abortController.signal);
            if(!response?.ok){
                let errorChatMsg: ChatMessage = {
                    id: uuid(),
                    role: ERROR,
                    content: "There was an error generating a response. Chat history can't be saved at this time. If the problem persists, please contact the site administrator.",
                    date: new Date().toISOString()
                }
                let resultConversation;
                if(conversationId){
                    resultConversation = appStateContext?.state?.chatHistory?.find((conv) => conv.id === conversationId)
                    if(!resultConversation){
                        console.error("Conversation not found.");
                        setIsLoading(false);
                        setShowLoadingMessage(false);
                        abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                        return;
                    }
                    resultConversation.messages.push(errorChatMsg);
                }else{
                    setMessages([...messages, userMessage, errorChatMsg])
                    setIsLoading(false);
                    setShowLoadingMessage(false);
                    abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                    return;
                }
                appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: resultConversation });
                setMessages([...resultConversation.messages]);
                return;
            }
            if (response?.body) {
                const reader = response.body.getReader();
                let runningText = "";

                while (true) {
                    setProcessMessages(messageStatus.Processing)
                    const {done, value} = await reader.read();
                    if (done) break;

                    var text = new TextDecoder("utf-8").decode(value);
                    const objects = text.split("\n");
                    objects.forEach((obj) => {
                        try {
                            runningText += obj;
                            result = JSON.parse(runningText);
                            result.choices[0].messages.forEach((obj) => {
                                obj.id = uuid();
                                obj.date = new Date().toISOString();
                            })
                            setShowLoadingMessage(false);
                            result.choices[0].messages.forEach((resultObj) => {
                                processResultMessage(resultObj, userMessage, conversationId);
                            })
                            runningText = "";
                        }
                        catch { }
                    });
                }

                let resultConversation;
                if(conversationId){
                    resultConversation = appStateContext?.state?.chatHistory?.find((conv) => conv.id === conversationId)
                    if(!resultConversation){
                        console.error("Conversation not found.");
                        setIsLoading(false);
                        setShowLoadingMessage(false);
                        abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                        return;
                    }
                    isEmpty(toolMessage) ?
                        resultConversation.messages.push(assistantMessage) :
                        resultConversation.messages.push(toolMessage, assistantMessage)
                }else{
                    resultConversation = {
                        id: result.history_metadata.conversation_id,
                        title: result.history_metadata.title,
                        messages: [userMessage],
                        date: result.history_metadata.date
                    }
                    isEmpty(toolMessage) ?
                        resultConversation.messages.push(assistantMessage) :
                        resultConversation.messages.push(toolMessage, assistantMessage)
                }
                if(!resultConversation){
                    setIsLoading(false);
                    setShowLoadingMessage(false);
                    abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                    return;
                }
                appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: resultConversation });
                isEmpty(toolMessage) ?
                    setMessages([...messages, assistantMessage]) :
                    setMessages([...messages, toolMessage, assistantMessage]);     
            }
            
        } catch ( e )  {
            if (!abortController.signal.aborted) {
                let errorMessage = "An error occurred. Please try again. If the problem persists, please contact the site administrator.";
                if (result.error?.message) {
                    errorMessage = result.error.message;
                }
                else if (typeof result.error === "string") {
                    errorMessage = result.error;
                }
                let errorChatMsg: ChatMessage = {
                    id: uuid(),
                    role: ERROR,
                    content: errorMessage,
                    date: new Date().toISOString()
                }
                let resultConversation;
                if(conversationId){
                    resultConversation = appStateContext?.state?.chatHistory?.find((conv) => conv.id === conversationId)
                    if(!resultConversation){
                        console.error("Conversation not found.");
                        setIsLoading(false);
                        setShowLoadingMessage(false);
                        abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                        return;
                    }
                    resultConversation.messages.push(errorChatMsg);
                }else{
                    if(!result.history_metadata){
                        console.error("Error retrieving data.", result);
                        setIsLoading(false);
                        setShowLoadingMessage(false);
                        abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                        return;
                    }
                    resultConversation = {
                        id: result.history_metadata.conversation_id,
                        title: result.history_metadata.title,
                        messages: [userMessage],
                        date: result.history_metadata.date
                    }
                    resultConversation.messages.push(errorChatMsg);
                }
                if(!resultConversation){
                    setIsLoading(false);
                    setShowLoadingMessage(false);
                    abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
                    return;
                }
                appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: resultConversation });
                setMessages([...messages, errorChatMsg]);
            } else {
                setMessages([...messages, userMessage])
            }
        } finally {
            setIsLoading(false);
            setShowLoadingMessage(false);
            abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
            setProcessMessages(messageStatus.Done)
        }
        return abortController.abort();

    }

    const clearChat = async () => {
        setClearingChat(true)
        if(appStateContext?.state.currentChat?.id && appStateContext?.state.isCosmosDBAvailable.cosmosDB){
            let response = await historyClear(appStateContext?.state.currentChat.id)
            if(!response.ok){
                setErrorMsg({
                    title: "Error clearing current chat",
                    subtitle: "Please try again. If the problem persists, please contact the site administrator.",
                })
                toggleErrorDialog();
            }else{
                appStateContext?.dispatch({ type: 'DELETE_CURRENT_CHAT_MESSAGES', payload: appStateContext?.state.currentChat.id});
                appStateContext?.dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: appStateContext?.state.currentChat});
                setActiveCitation(undefined);
                setIsCitationPanelOpen(false);
                setMessages([])
            }
        }
        setClearingChat(false)
    };

    const newChat = () => {
        setProcessMessages(messageStatus.Processing)
        setMessages([])
        setIsCitationPanelOpen(false);
        setActiveCitation(undefined);
        appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: null });
        setProcessMessages(messageStatus.Done)
    };

    const stopGenerating = () => {
        abortFuncs.current.forEach(a => a.abort());
        setShowLoadingMessage(false);
        setIsLoading(false);
    }

    useEffect(() => {
        if (appStateContext?.state.currentChat) {
            setMessages(appStateContext.state.currentChat.messages)
        } else{
            setMessages([])
        }

        if (appStateContext?.state.sidebarSelection === SidebarOptions.Grant) {
            appStateContext?.dispatch({ type: 'UPDATE_GRANTS_CHAT', payload: appStateContext?.state.currentChat });
        } else if (appStateContext?.state.sidebarSelection === SidebarOptions.Article) {
            appStateContext?.dispatch({ type: 'UPDATE_ARTICLES_CHAT', payload: appStateContext?.state.currentChat });
        }
    }, [appStateContext?.state.currentChat]);

    useEffect(() => {
        abortFuncs.current.forEach(a => a.abort());

    }, [appStateContext?.state.sidebarSelection]);
    
    useLayoutEffect(() => {
        const saveToDB = async (messages: ChatMessage[], id: string) => {
            const response = await historyUpdate(messages, id)
            return response
        }

        if (appStateContext && appStateContext.state.currentChat && processMessages === messageStatus.Done) {
                if(appStateContext.state.isCosmosDBAvailable.cosmosDB){
                    if(!appStateContext?.state.currentChat?.messages){
                        console.error("Failure fetching current chat state.")
                        return 
                    }
                    saveToDB(appStateContext.state.currentChat.messages, appStateContext.state.currentChat.id)
                    .then((res) => {
                        if(!res.ok){
                            let errorMessage = "An error occurred. Answers can't be saved at this time. If the problem persists, please contact the site administrator.";
                            let errorChatMsg: ChatMessage = {
                                id: uuid(),
                                role: ERROR,
                                content: errorMessage,
                                date: new Date().toISOString()
                            }
                            if(!appStateContext?.state.currentChat?.messages){
                                let err: Error = {
                                    ...new Error,
                                    message: "Failure fetching current chat state."
                                }
                                throw err
                            }
                            setMessages([...appStateContext?.state.currentChat?.messages, errorChatMsg])
                        }
                        return res as Response
                    })
                    .catch((err) => {
                        console.error("Error: ", err)
                        let errRes: Response = {
                            ...new Response,
                            ok: false,
                            status: 500,
                        }
                        return errRes;
                    })
                }else{
                }
                appStateContext?.dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: appStateContext.state.currentChat });
                setMessages(appStateContext.state.currentChat.messages)
            setProcessMessages(messageStatus.NotRunning)
        }
    }, [processMessages]);

    useEffect(() => {
        if (AUTH_ENABLED !== undefined) getUserInfoList();
    }, [AUTH_ENABLED]);

    useLayoutEffect(() => {
        chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" })
    }, [showLoadingMessage, processMessages]);

    const onShowCitation = (citation: Citation) => {
        setActiveCitation(citation);
        setIsCitationPanelOpen(true);
    };

    const onViewSource = (citation: Citation) => {
        if (citation.url && !citation.url.includes("blob.core")) {
            window.open(citation.url, "_blank");
        }
    };

    const parseCitationFromMessage = (message: ChatMessage) => {
        if (message?.role && message?.role === "tool") {
            try {
                const toolMessage = JSON.parse(message.content) as ToolMessageContent;
                return toolMessage.citations;
            }
            catch {
                return [];
            }
        }
        return [];
    }

    const disabledButton = () => {
        return isLoading || (messages && messages.length === 0) || clearingChat || appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading
    }

    const context = useContext(AppStateContext);

    if (!context) {
        throw new Error('AppStateContext is undefined. Make sure you have wrapped your component tree with AppStateProvider.');
    }

    function handleToggleFavorite(citations: Citation[]): void {
        citations.forEach(citation => {
            const isFavorited = appStateContext?.state.favoritedCitations.some(favCitation => favCitation.id === citation.id);
            if (!isFavorited) {
                // If citation is not already favorited, dispatch action to toggle its favorite status
                appStateContext?.dispatch({ type: 'TOGGLE_FAVORITE_CITATION', payload: { citation } });
            }
        });
    }
        
    var title = "";
    switch (appStateContext?.state.sidebarSelection) {
        case SidebarOptions.Article:
            title = "Explore Scientific Journals";
            break;
        case SidebarOptions.Grant:
            title = "Explore Grant Documents";
            break;
    }

    return (
        <div className={styles.container} role="main">
            {false ? (
                <Stack className={styles.chatEmptyState}>
                    <ShieldLockRegular className={styles.chatIcon} style={{color: 'darkorange', height: "200px", width: "200px"}}/>
                    <h1 className={styles.chatEmptyStateTitle}>Authentication Not Configured</h1>
                    <h2 className={styles.chatEmptyStateSubtitle}>
                        This app does not have authentication configured. Please add an identity provider by finding your app in the 
                        <a href="https://portal.azure.com/" target="_blank"> Azure Portal </a>
                        and following 
                         <a href="https://learn.microsoft.com/en-us/azure/app-service/scenario-secure-app-authentication-app-service#3-configure-authentication-and-authorization" target="_blank"> these instructions</a>.
                    </h2>
                    <h2 className={styles.chatEmptyStateSubtitle} style={{fontSize: "20px"}}><strong>Authentication configuration takes a few minutes to apply. </strong></h2>
                    <h2 className={styles.chatEmptyStateSubtitle} style={{fontSize: "20px"}}><strong>If you deployed in the last 10 minutes, please wait and reload the page after 10 minutes.</strong></h2>
                </Stack>
            ) : (
                <Stack horizontal className={styles.chatRoot}>
                    <div className={styles.chatContainer}>
                        <Text variant="xLarge"
                            style={{
                                color: "#797775",
                                marginLeft: "15px",
                                marginTop: "25px",
                                alignSelf: "start",
                            }}
                        >
                            {title}
                        </Text>
                        { false ? (
                            <Stack className={styles.chatEmptyState}>
                                <img
                                    src={Azure}
                                    className={styles.chatIcon}
                                    aria-hidden="true"
                                />
                                <h1 className={styles.chatEmptyStateTitle}>Start chatting</h1>
                                <h2 className={styles.chatEmptyStateSubtitle}>This chatbot is configured to answer your questions</h2>
                            </Stack>
                        ) : (
                            <div className={styles.chatMessageStream} style={{ marginBottom: isLoading ? "40px" : "0px"}} role="log">
                                
                                {messages.map((answer, index) => (
                                    <>
                                        {answer.role === "user" ? (
                                            <div className={styles.chatMessageUser} tabIndex={0}>
                                                <div className={styles.chatMessageUserMessage}>{answer.content}</div>
                                            </div>
                                        ) : (
                                            answer.role === "assistant" ? <div className={styles.chatMessageGpt}>
                                                <Answer
                                                    answer={{
                                                        answer: answer.content,
                                                        citations: parseCitationFromMessage(messages[index - 1]),
                                                    }}
                                                    onCitationClicked={c => onShowCitation(c)}
                                                />
                                            </div> : answer.role === ERROR ? <div className={styles.chatMessageError}>
                                                <Stack horizontal className={styles.chatMessageErrorContent}>
                                                    <ErrorCircleRegular className={styles.errorIcon} style={{color: "rgba(182, 52, 67, 1)"}} />
                                                    <span>Error</span>
                                                </Stack>
                                                <span className={styles.chatMessageErrorContent}>{answer.content}</span>
                                            </div> : null
                                        )}
                                    </>
                                ))}
                                {showLoadingMessage && (
                                    <>
                                        <div className={styles.chatMessageGpt}>
                                            <Answer
                                                answer={{
                                                    answer: "Generating answer...",
                                                    citations: []
                                                }}
                                                onCitationClicked={() => null}
                                            />
                                        </div>
                                    </>
                                )}
                                <div ref={chatMessageStreamEnd} />
                            </div>
                        )}

                        <Stack horizontal className={styles.chatInput}>
                            {isLoading && (
                                <Stack 
                                    horizontal
                                    className={styles.stopGeneratingContainer}
                                    role="button"
                                    aria-label="Stop generating"
                                    tabIndex={0}
                                    onClick={stopGenerating}
                                    onKeyDown={e => e.key === "Enter" || e.key === " " ? stopGenerating() : null}
                                    >
                                        <SquareRegular className={styles.stopGeneratingIcon} aria-hidden="true"/>
                                        <span className={styles.stopGeneratingText} aria-hidden="true">Stop generating</span>
                                </Stack>
                            )}
                            <Stack>
                                {appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured && <CommandBarButton
                                    role="button"
                                    styles={{ 
                                        icon: { 
                                            color: '#FFFFFF',
                                        },
                                        iconDisabled: {
                                            color: "#BDBDBD !important"
                                        },
                                        root: {
                                            color: '#FFFFFF',
                                            background: "#0F6CBD",
                                        },
                                        rootDisabled: {
                                            background: "#F0F0F0"
                                        }
                                    }}
                                    className={styles.newChatIcon}
                                    iconProps={{ iconName: 'Add' }}
                                    onClick={newChat}
                                    disabled={disabledButton()}
                                    aria-label="start a new chat button"
                                />}
                                <CommandBarButton
                                    role="button"
                                    styles={{ 
                                        icon: { 
                                            color: '#FFFFFF',
                                        },
                                        iconDisabled: {
                                            color: "#BDBDBD !important" ,
                                        },
                                        root: {
                                            color: '#FFFFFF',
                                            background: "#0F6CBD",
                                            borderRadius: "100px",
                                        },
                                        rootDisabled: {
                                            background: "#F0F0F0"
                                        },

                                        // disable hover effect
                                        rootHovered: {
                                            background: "#0F6CBD",
                                            color: '#FFFFFF',
                                        },

                                        iconHovered: {
                                            color: '#FFFFFF',
                                        },
                                        
                                    }}
                                    className={appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured ? styles.clearChatBroom : styles.clearChatBroomNoCosmos}
                                    iconProps={{ iconName: 'Broom' }}
                                    onClick={appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured ? clearChat : newChat}
                                    disabled={disabledButton()}
                                    aria-label="clear chat button"

                                />
                                <Dialog
                                    hidden={hideErrorDialog}
                                    onDismiss={handleErrorDialogClose}
                                    dialogContentProps={errorDialogContentProps}
                                    modalProps={modalProps}
                                >
                                </Dialog>
                            </Stack>
                            <QuestionInput
                                clearOnSend
                                placeholder="Type a new question..."
                                disabled={isLoading}
                                onSend={(question, id) => {
                                    appStateContext?.state.isCosmosDBAvailable?.cosmosDB ? makeApiRequestWithCosmosDB(question, id) : makeApiRequestWithoutCosmosDB(question, id)
                                }}
                                conversationId={appStateContext?.state.currentChat?.id ? appStateContext?.state.currentChat?.id : undefined}
                                chatType={chatType}
                            />
                        </Stack>
                    </div>
                    {/* Citation Panel */}
                    {messages && messages.length > 0 && isCitationPanelOpen && activeCitation && (
                    <Stack.Item className={styles.citationPanel} tabIndex={0} role="tabpanel" aria-label="Citations Panel">
                        <Stack aria-label="Citations Panel Header Container" horizontal className={styles.citationPanelHeaderContainer} horizontalAlign="space-between" verticalAlign="center">
                            <Stack horizontal verticalAlign="center">
                                <span aria-label="Citations" className={styles.citationPanelHeader}>Citations</span>
                            </Stack>
                            <IconButton iconProps={{ iconName: 'Cancel'}} aria-label="Close citations panel" onClick={() => setIsCitationPanelOpen(false)} />
                        </Stack>
                        <h5 className={styles.citationPanelTitle} tabIndex={0} title={activeCitation.url && !activeCitation.url.includes("blob.core") ? activeCitation.url : activeCitation.title ?? ""} onClick={() => onViewSource(activeCitation)}>{activeCitation.title}</h5>
                        <div tabIndex={0}>
                            <ReactMarkdown
                                linkTarget="_blank"
                                className={styles.citationPanelContent}
                                children={activeCitation.content}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                            />
                        </div>
                        <FluentButton
                            iconProps={{ iconName: 'CirclePlus', style: { color: 'white' }}} // Set icon color to white
                            onClick={() => {
                                if (activeCitation.filepath && activeCitation.url) {
                                    const newCitation = {
                                        id: `${activeCitation.filepath}-${activeCitation.url}`, // Convert id to string and provide a default value of 0
                                        title: activeCitation.title,
                                        url: activeCitation.url,
                                        content: activeCitation.content,
                                        filepath: activeCitation.filepath,
                                        metadata: activeCitation.metadata,
                                        chunk_id: activeCitation.chunk_id,
                                        reindex_id: activeCitation.reindex_id,
                                        type: appStateContext?.state.sidebarSelection?.toString() ?? "",
                                    };
                                    handleToggleFavorite([newCitation]);
                                }
                            }}
                            styles={{
                                root: { backgroundColor: '#0078D4', borderRadius: '4px', marginTop: '10px', padding: '12px 24px', color: 'white' }, // Set text color to white
                                rootHovered: { backgroundColor: '#005A9E' } // Color change on hover
                            }}
                        >
                            Favorite
                        </FluentButton>
                    </Stack.Item>
                )}

                {(appStateContext?.state.isChatHistoryOpen && appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured) && <ChatHistoryPanel/>}
                </Stack>
            )}
        </div>
    );
};

export default Chat;

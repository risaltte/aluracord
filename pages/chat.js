import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React from 'react';
import appConfig from '../config.json';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { ButtonSendSticker } from '../src/components/ButtonSendSticker';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzMzNTI1NSwiZXhwIjoxOTU4OTExMjU1fQ.DOIrCQai3L05rlciL2wohPtUBB4o8L8fN3N3Loiy9FI';
const SUPABASE_URL = 'https://pjsfugegrsbmmqxqwbgu.supabase.co';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escutaMensagensEmTempoReal(adicionaMensagem) {
    return supabaseClient
        .from('mensagens')
        .on('INSERT', (respostaLive) => {
            adicionaMensagem(respostaLive.new);
        })
        .subscribe();

}

export default function ChatPage() {
    const roteamento = useRouter();
    const [mensagem, setMensagem] = React.useState('');
    const [listaDeMensagens, setListaDeMensagens] = React.useState([]);

    const usuarioLogado = roteamento.query.username;

    React.useEffect(() => {
        supabaseClient
            .from('mensagens')
            .select('*')
            .order('id', { ascending: false })
            .then(({ data }) => {
                setListaDeMensagens(data);
            });
        
        escutaMensagensEmTempoReal((novaMensagem) => {
            setListaDeMensagens((valorAtualDaLista) => {
                return [
                    novaMensagem,
                    ...valorAtualDaLista
                ]
            });
        });

    }, []);

    function handleNovaMensagem(novaMensagem) {
        if (novaMensagem === '') {
            return;
        }

        const mensagem = {
            de: usuarioLogado,
            texto: novaMensagem
        };

        supabaseClient
            .from('mensagens')
            .insert([
                mensagem
            ])
            .then(({ data }) => {
               
            });

        setMensagem('');
    }

    async function handleDeleteMensagem(mensagemId) {
        const mensagem = listaDeMensagens.find(mensagem => mensagem.id === mensagemId);

        if (!mensagem || mensagem.de !== usuarioLogado) {
            return;
        }

        const { data, error } = await supabaseClient
        .from('mensagens')
        .delete()
        .match({ id: mensagemId })

        if (data.length === 0 || data.length === null) {
            return;
        }
            
        const updatedListaDeMensagens = listaDeMensagens.filter(mensagem => mensagem.id !== mensagemId);
        setListaDeMensagens(updatedListaDeMensagens);
    }

    return (
        <Box
            styleSheet={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: appConfig.theme.colors.primary[500],
                backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
                backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
                color: appConfig.theme.colors.neutrals['000']
            }}
        >
            <Box
                styleSheet={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
                    borderRadius: '5px',
                    backgroundColor: appConfig.theme.colors.neutrals[700],
                    height: '100%',
                    maxWidth: '95%',
                    maxHeight: '95vh',
                    padding: '32px',
                }}
            >
                <Header />
                <Box
                    styleSheet={{
                        position: 'relative',
                        display: 'flex',
                        flex: 1,
                        height: '80%',
                        backgroundColor: appConfig.theme.colors.neutrals[600],
                        flexDirection: 'column',
                        borderRadius: '5px',
                        padding: '16px',
                    }}
                >

                    <MessageList mensagens={listaDeMensagens} onDeleteMessage={handleDeleteMensagem} usuarioLogado={usuarioLogado}/>

                    <Box
                        as="form"
                        styleSheet={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <TextField
                            value={mensagem}
                            onChange={(event) => setMensagem(event.target.value)}
                            onKeyPress={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleNovaMensagem(mensagem);
                                }
                            }}
                            placeholder="Insira sua mensagem aqui..."
                            type="textarea"
                            styleSheet={{
                                width: '100%',
                                border: '0',
                                resize: 'none',
                                borderRadius: '5px',
                                padding: '6px 8px',
                                backgroundColor: appConfig.theme.colors.neutrals[800],
                                marginRight: '8px',
                                color: appConfig.theme.colors.neutrals[200],
                            }}
                        />
                        <ButtonSendSticker 
                            onStickerClick={(sticker) => {
                                handleNovaMensagem(':sticker: ' + sticker);
                              }}
                        />
                        <Button 
                            iconName="arrowRight" 
                            onClick={() => handleNovaMensagem(mensagem)}
                            colorVariant="positive"
                            styleSheet={{
                                minWidth: '50px',
                                minHeight: '50px',
                                fontSize: '20px',
                                marginLeft: '8px',
                                transition: 'background 0.2s',
                                background: appConfig.theme.colors.primary[700],
                                alignSelf: 'flex-start'
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

function Header() {
    const roteamento = useRouter();

    return (
        <>
            <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                <Text variant='heading5'>
                    Chat
                </Text>
                <Button
                    onClick={() => roteamento.push('/')}
                    variant='tertiary'
                    colorVariant='neutral'
                    label='Logout'
                    href="/"
                />
            </Box>
        </>
    )
}

function MessageList(props) {
    return (
        <Box
            tag="ul"
            styleSheet={{
                overflowY: 'scroll',
                display: 'flex',
                flexDirection: 'column-reverse',
                flex: 1,
                color: appConfig.theme.colors.neutrals["000"],
                marginBottom: '16px',
            }}
        >

            {props.mensagens.map(mensagem => (
                <Text
                    key={mensagem.id}
                    tag="li"
                    styleSheet={{
                        borderRadius: '5px',
                        padding: '6px',
                        marginBottom: '12px',
                        hover: {
                            backgroundColor: appConfig.theme.colors.neutrals[700],
                        }
                    }}
                >
                    <Box
                        styleSheet={{
                            marginBottom: '8px',
                        }}
                    >
                        <Image
                            styleSheet={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'inline-block',
                                marginRight: '8px',
                            }}
                            src={`https://github.com/${mensagem.de}.png`}
                        />
                        <Text tag="strong">
                            {mensagem.de}
                        </Text>
                        <Text
                            styleSheet={{
                                fontSize: '10px',
                                marginLeft: '8px',
                                color: appConfig.theme.colors.neutrals[300],
                            }}
                            tag="span"
                        >
                            {(new Date().toLocaleDateString())}
                        </Text>
                        <Button 
                            label='x'
                            onClick={() => props.onDeleteMessage(mensagem.id)}
                            styleSheet={{
                                width: '5px',
                                background: 'transparent',
                                padding: '0 8px',
                                borderRadius: '80px',
                                marginLeft: '10px',
                                display: props.usuarioLogado === mensagem.de ? 'inline-block' : 'none'
                            }}
                        />
                    </Box>
                    {mensagem.texto.startsWith(':sticker:')
                        ? (
                            <Image 
                                src={mensagem.texto.replace(':sticker:', '')}
                                styleSheet={{
                                    maxWidth: '300px'
                                }}
                            
                            />
                        )
                        : (
                            mensagem.texto
                        )
                    }
                </Text>
            ))}
        </Box>
    )
}
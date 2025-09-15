const gmail_process = {
    "login": [

        {"action": "check_if_exist", "xpath":"//a[starts-with(@href,'https://accounts.google.com/AccountChooser')] | //input[@id='identifierId'] | //div[@id='gbwa'] | //div[@id='main-message']", "wait": 6, "sleep": 0,
            //div[@id='gbwa']  deja connecter sur boi de reception 
            "sub_action": [
                {"action": "check_if_exist", "xpath":"//a[starts-with(@href,'https://accounts.google.com/AccountChooser')]", "wait": 3, "sleep": 0,
                    "sub_action": [
                        {"action": "click", "xpath": "//a[starts-with(@href,'https://accounts.google.com/AccountChooser')]", "sleep": 0, "wait": 1}
                    ]
                }, 
                
                {"action": "check_if_exist", "xpath": "//input[@id='identifierId']", "wait": 3,"sleep": 0,
                    "sub_action": [
                        {"action": "send_keys", "xpath": "//input[@id='identifierId']", "value": "__email__" , "wait": 1, "sleep": 1},
                        {"id":1,"action": "press_keys", "xpath": "//button[.//span[text()='Suivant']] | //button[.//span[text()='Next']]", "wait": 1, "sleep": 5 ,
                            "sub_action": [

                                {"action": "check_if_exist", "xpath": "(//a[@aria-label='Try to restore' or @aria-label='Essayer de restaurer'])  | //div[span and (text()[contains(., 'Impossible de trouver votre compte Google')] or .//font[contains(text(), 'Unable to find your Google account')])]", "wait": 4,"sleep": 0,
                                     "sub_action":[
                                        {"action": "check_if_exist", "xpath": "//a[@aria-label='Try to restore' or @aria-label='Essayer de restaurer']", "wait": 2,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//a[@aria-label='Try to restore' or @aria-label='Essayer de restaurer']", "wait": 1, "sleep": 0 ,   "obligatoire":true , "type":"restore_account"},   // restore account 
                                            ]
                                        }
                                        , 
                                        // {"action": "check_if_exist", "xpath": "//form//div[contains(text(), 'robot')]", "wait": 4,"sleep": 0, 
                                        //     "sub_action": [
                                        //         {"action": "check_if_exist", "xpath": "//form//div[contains(text(), 'robot')]", "wait": 2, "sleep": 2 },   // validation capcha 
                                        //     ]
                                        // },
                                        {"action": "check_if_exist", "xpath":   "//div[span and (text()[contains(., 'Impossible de trouver votre compte Google')] or .//font[contains(text(), 'Unable to find your Google account')])]", "wait": 4,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist",  "xpath": "//div[span and (text()[contains(., 'Impossible de trouver votre compte Google')] or .//font[contains(text(), 'Unable to find your Google account')])]","wait": 2, "sleep": 2 , "obligatoire":true , "type":"others"},   // others
                                            ]
                                        }

                                    ]
                                }
                                                      
                            ]
                        },
                        {"action": "send_keys", "xpath": "//input[@type='password']", "value":"__password__", "wait": 600000 , "sleep": 1},
                        {"action": "press_keys", "xpath": "//button[.//span[text()='Suivant']] | //button[.//span[text()='Next']]",  "wait": 3, "sleep": 3 ,
                            "sub_action": [

                                {"action": "check_if_exist", "xpath": "//div[@aria-live='polite']//div[@aria-hidden='true']/following-sibling::div//span | (//a[(text()='En savoir plus' or  text()='Learn more')]) | //input[@id='knowledgePreregisteredEmailInput'] | //input[@type='tel' and @pattern='[0-9 ]*'] | //input[@type='tel' and @id='phoneNumberId'] | //button[span[contains(text(), 'Télécharger vos données') or contains(text(), 'Download your data')]]", "wait": 4,"sleep": 0, 

                                    "sub_action": [
                                        {"action": "check_if_exist", "xpath": "//div[@aria-live='polite']//div[@aria-hidden='true']/following-sibling::div//span", "wait": 3,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//div[@aria-live='polite']//div[@aria-hidden='true']/following-sibling::div//span", "wait": 2, "sleep": 0 , "obligatoire":true , "type":"password_changed"},   // Le mot de passe est incorrect
                                            ]
                                        },                           
                        
                                        {"action": "check_if_exist", "xpath":  "//a[(text()='En savoir plus' or text()='Learn more')]/ancestor::div[1][contains(., 'détecté') or contains(., 'detected')]"   , "wait": 3,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//a[(text()='En savoir plus' or text()='Learn more')]/ancestor::div[1][contains(., 'détecté') or contains(., 'detected')]", "wait": 1, "sleep": 0 , "obligatoire":true , "type":"Activite_suspecte"},   // Activité suspecte
                                            ]
                                        },
                                        
                                        {"action": "check_if_exist", "xpath": "//input[@id='knowledgePreregisteredEmailInput']", "wait": 2,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//input[@id='knowledgePreregisteredEmailInput']", "wait": 1, "sleep": 0 , "obligatoire":true , "type":"code_de_validation"},   // code de validation
                                            ]
                                        }
                                        ,
                                        {"action": "check_if_exist", "xpath": "//input[@type='tel' and @pattern='[0-9 ]*']", "wait": 2,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//input[@type='tel' and @pattern='[0-9 ]*']", "wait": 1, "sleep": 0 , "obligatoire":true , "type":"others"},   // others
                                            ]
                                        },
                                        // input[@type="tel" and @pattern="[0-9 ]*"]

                                        {"action": "check_if_exist", "xpath": '//button[span[contains(text(), "Télécharger vos données") or contains(text(), "Download your data")]]', "wait": 2,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": '//button[span[contains(text(), "Télécharger vos données") or contains(text(), "Download your data")]]', "wait": 1, "sleep": 0 ,  "obligatoire":true , "type":"Activite_suspecte"},   //Activité suspecte
                                            ]
                                        }, 

                                        {"action": "check_if_exist",   "xpath": '//input[@type="tel" and @id="phoneNumberId"]', "wait": 10,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist",  "xpath": '//input[@type="tel" and @id="phoneNumberId"]', "wait": 2, "sleep": 0 ,  "obligatoire":true , "type":"code_de_validation"},   //code_de_validation
                                            ]
                                        }, 
                                    ]
                                }  
                                
                            ]
                        },

                        {"action": "check_if_exist", "xpath": "(//div[@data-challengeid])[last()]", "wait": 3, "sleep": 2,  // pour recovry if exist 
                            "sub_action": [
                                {"action": "click", "xpath": "(//div[@data-challengeid])[last()]" ,"wait": 1, "sleep": 5},
                                {"action": "send_keys", "xpath": "//input[@id='knowledge-preregistered-email-response']", "value":"__recovry__","wait": 1,"sleep": 0}, //pour input recovry 
                                {"action": "press_keys", "xpath": "//button[.//span[text()='Suivant']] | //button[.//span[text()='Next']]", "wait": 1, "sleep": 3 ,  
                                    "sub_action": [
                                        {"action": "check_if_exist", "xpath": "//div[@aria-live='polite']//div[@aria-hidden='true']/following-sibling::div//span", "wait": 3,"sleep": 0, 
                                            "sub_action": [
                                                {"action": "check_if_exist", "xpath": "//div[@aria-live='polite']//div[@aria-hidden='true']/following-sibling::div//span", "wait": 2, "sleep": 0  , "obligatoire":true , "type":"recovry_incorrect"},   //Le recovry est incorrect
                                            ]
                                        }                            
                                    ]
                                }
                            ]
                        }
                    ]
                },

                {"action": "check_if_exist", "xpath":"//div[@id='main-message']", "wait": 1, "sleep": 0,
                    "sub_action": [
                        {"action": "click", "xpath": "//div[@id='main-message']", "sleep": 0, "wait": 5 , "obligatoire":true , "type":"bad_proxy"}
                    ]
                }, 

                //   arrete ici pas triter pourqui 
                {"action": "check_if_exist", "xpath": "//div[@data-secondary-action-label='Not now']|//div[@data-secondary-action-label='Pas maintenant']", "wait": 3,"sleep": 0, //div Not now 
                    "sub_action": [
                        {"action": "click", "xpath": "//div[@data-secondary-action-label='Not now']/div/div[2]/div/div/button|//div[@data-secondary-action-label='Pas maintenant']/div/div[2]/div/div/button", "wait": 2, "sleep": 0},   //button  Not now 
                    ]
                },

                {"action": "check_if_exist", "xpath": "//button[@aria-label='Save' or @aria-label='Sauvegarder']", "wait": 3,"sleep": 0, 
                    "sub_action": [
                        {"action": "click", "xpath": "//button[@aria-label='Save' or @aria-label='Sauvegarder']", "wait": 1, "sleep": 3},   //button Save 
                    ]
                },

                {"action": "check_if_exist", "xpath": "//button[@aria-label='Skip' or @aria-label='Sauter']", "wait": 3,"sleep":0 , //div Not now 
                    "sub_action": [
                        {"action": "click", "xpath": "//button[@aria-label='Skip' or @aria-label='Sauter']", "wait": 1, "sleep": 3},   //button  Not now 
                    ]
                }
              
            ]
        }
    ]

}




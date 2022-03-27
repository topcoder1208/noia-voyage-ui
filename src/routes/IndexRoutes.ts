import { Router } from "express";
const router = Router();

import {
    updateMetaDataAction,
    updateAuthorityAction,
    updateAuthorityFromJsonAction
} from "../controllers/IndexController";

router.route("/updateMetaData").post(updateMetaDataAction);
router.route("/updateAuthority/:mintKey").get(updateAuthorityAction);
router.route("/updateAuthorityFromJsonAction").get(updateAuthorityFromJsonAction);

export default router;

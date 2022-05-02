import { Router } from "express";
const router = Router();

import {
    updateMetaDataAction,
    updateAuthorityAction,
    updateAuthorityFromJsonAction,
    clearNftTraits
} from "../controllers/IndexController";

router.route("/updateMetaData").post(updateMetaDataAction);
router.route("/updateAuthority/:mintKey").get(updateAuthorityAction);
router.route("/updateAuthorityFromJsonAction").get(updateAuthorityFromJsonAction);
router.route("/clearNftTraits").get(clearNftTraits);

export default router;

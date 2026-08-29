package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

type contributionOut struct {
	ID     string `json:"id"`
	Member string `json:"member"`
	Amount int    `json:"amount"`
	Txn    string `json:"txn"`
	Date   string `json:"date"`
}

func toContribOut(c models.Contribution) contributionOut {
	return contributionOut{ID: c.ID, Member: c.Member, Amount: c.Amount, Txn: c.Txn, Date: fmtDate(c.Date)}
}

type projectOut struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Target        int               `json:"target"`
	Note          *string           `json:"note"`
	Members       []string          `json:"members"`
	Contributions []contributionOut `json:"contributions"`
}

func toProjectOut(p models.Project) projectOut {
	members := make([]string, len(p.Members))
	for i, m := range p.Members {
		members[i] = m.Name
	}
	contribs := make([]contributionOut, len(p.Contributions))
	for i, c := range p.Contributions {
		contribs[i] = toContribOut(c)
	}
	var note *string
	if p.Note != "" {
		note = &p.Note
	}
	return projectOut{ID: p.ID, Name: p.Name, Target: p.Target, Note: note, Members: members, Contributions: contribs}
}

func loadProject(db *gorm.DB, id, userID string) (*models.Project, error) {
	var p models.Project
	err := db.Preload("Members").Preload("Contributions").
		Where("id = ? AND user_id = ?", id, userID).First(&p).Error
	return &p, err
}

func ListProjects(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var projects []models.Project
		db.Preload("Members").Preload("Contributions").Where("user_id = ?", currentUser(c).ID).Find(&projects)
		out := make([]projectOut, len(projects))
		for i, p := range projects {
			out[i] = toProjectOut(p)
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name   string `json:"name" binding:"required"`
			Target int    `json:"target"`
			Note   string `json:"note"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		u := currentUser(c)
		p := models.Project{UserID: u.ID, Name: body.Name, Target: body.Target, Note: body.Note}
		db.Create(&p)
		db.Create(&models.ProjectMember{ProjectID: p.ID, Name: u.Name})
		p2, _ := loadProject(db, p.ID, u.ID)
		c.JSON(http.StatusCreated, toProjectOut(*p2))
	}
}

func GetProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		p, err := loadProject(db, c.Param("id"), currentUser(c).ID)
		if err != nil {
			notFound(c, "Project")
			return
		}
		c.JSON(http.StatusOK, toProjectOut(*p))
	}
}

func ProjectSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		p, err := loadProject(db, c.Param("id"), currentUser(c).ID)
		if err != nil {
			notFound(c, "Project")
			return
		}
		total := 0
		for _, contrib := range p.Contributions {
			total += contrib.Amount
		}
		remaining := 0
		pct := 0
		if p.Target > 0 {
			remaining = p.Target - total
			if remaining < 0 {
				remaining = 0
			}
			pct = total * 100 / p.Target
			if pct > 100 {
				pct = 100
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"target": p.Target, "totalContributed": total,
			"remaining": remaining, "pct": pct, "memberCount": len(p.Members),
		})
	}
}

func UpdateProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		p, err := loadProject(db, c.Param("id"), currentUser(c).ID)
		if err != nil {
			notFound(c, "Project")
			return
		}
		var body struct {
			Name   *string `json:"name"`
			Target *int    `json:"target"`
			Note   *string `json:"note"`
		}
		c.ShouldBindJSON(&body)
		if body.Name != nil {
			p.Name = *body.Name
		}
		if body.Target != nil {
			p.Target = *body.Target
		}
		if body.Note != nil {
			p.Note = *body.Note
		}
		db.Save(p)
		p2, _ := loadProject(db, p.ID, currentUser(c).ID)
		c.JSON(http.StatusOK, toProjectOut(*p2))
	}
}

func DeleteProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Where("project_id = ?", p.ID).Delete(&models.Contribution{}).Error; err != nil {
				return err
			}
			if err := tx.Where("project_id = ?", p.ID).Delete(&models.ProjectMember{}).Error; err != nil {
				return err
			}
			return tx.Delete(&p).Error
		})
		if err != nil {
			errResp(c, http.StatusInternalServerError, "delete_failed", "Could not delete project")
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// ── Members ───────────────────────────────────────────────────────────────────

func ListMembers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var members []models.ProjectMember
		db.Where("project_id = ?", p.ID).Find(&members)
		c.JSON(http.StatusOK, members)
	}
}

func AddMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var body struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		var existing models.ProjectMember
		if db.Where("project_id = ? AND name = ?", p.ID, body.Name).First(&existing).Error == nil {
			c.JSON(http.StatusCreated, existing)
			return
		}
		m := models.ProjectMember{ProjectID: p.ID, Name: body.Name}
		db.Create(&m)
		c.JSON(http.StatusCreated, m)
	}
}

func GetMemberDetail(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var m models.ProjectMember
		if db.Where("id = ? AND project_id = ?", c.Param("memberId"), p.ID).First(&m).Error != nil {
			notFound(c, "Member")
			return
		}
		var contribs []models.Contribution
		db.Where("project_id = ? AND member = ?", p.ID, m.Name).Find(&contribs)
		total := 0
		out := make([]contributionOut, len(contribs))
		for i, contrib := range contribs {
			total += contrib.Amount
			out[i] = toContribOut(contrib)
		}
		c.JSON(http.StatusOK, gin.H{"name": m.Name, "totalContributed": total, "contributions": out})
	}
}

func RemoveMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var m models.ProjectMember
		if db.Where("id = ? AND project_id = ?", c.Param("memberId"), p.ID).First(&m).Error != nil {
			notFound(c, "Member")
			return
		}
		var count int64
		db.Model(&models.Contribution{}).Where("project_id = ? AND member = ?", p.ID, m.Name).Count(&count)
		if count > 0 {
			errResp(c, http.StatusConflict, "conflict", "Cannot remove a member who has contributions")
			return
		}
		db.Delete(&m)
		c.Status(http.StatusNoContent)
	}
}

// ── Contributions ─────────────────────────────────────────────────────────────

func ListContributions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var contribs []models.Contribution
		db.Where("project_id = ?", p.ID).Find(&contribs)
		out := make([]contributionOut, len(contribs))
		for i, contrib := range contribs {
			out[i] = toContribOut(contrib)
		}
		c.JSON(http.StatusOK, out)
	}
}

func AddContribution(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var body struct {
			Member string `json:"member" binding:"required"`
			Amount int    `json:"amount" binding:"required"`
			Txn    string `json:"txn" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		if body.Amount <= 0 {
			validationErr(c, "Amount must be greater than zero")
			return
		}
		contrib := models.Contribution{ProjectID: p.ID, Member: body.Member, Amount: body.Amount, Txn: body.Txn}
		db.Create(&contrib)
		c.JSON(http.StatusCreated, toContribOut(contrib))
	}
}

func GetContribution(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var contrib models.Contribution
		if db.Where("id = ? AND project_id = ?", c.Param("contributionId"), p.ID).First(&contrib).Error != nil {
			notFound(c, "Contribution")
			return
		}
		c.JSON(http.StatusOK, toContribOut(contrib))
	}
}

func UpdateContribution(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var contrib models.Contribution
		if db.Where("id = ? AND project_id = ?", c.Param("contributionId"), p.ID).First(&contrib).Error != nil {
			notFound(c, "Contribution")
			return
		}
		var body struct {
			Member *string `json:"member"`
			Amount *int    `json:"amount"`
			Txn    *string `json:"txn"`
		}
		c.ShouldBindJSON(&body)
		if body.Member != nil {
			contrib.Member = *body.Member
		}
		if body.Amount != nil {
			contrib.Amount = *body.Amount
		}
		if body.Txn != nil {
			contrib.Txn = *body.Txn
		}
		db.Save(&contrib)
		c.JSON(http.StatusOK, toContribOut(contrib))
	}
}

func DeleteContribution(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p models.Project
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&p).Error != nil {
			notFound(c, "Project")
			return
		}
		var contrib models.Contribution
		if db.Where("id = ? AND project_id = ?", c.Param("contributionId"), p.ID).First(&contrib).Error != nil {
			notFound(c, "Contribution")
			return
		}
		db.Delete(&contrib)
		c.Status(http.StatusNoContent)
	}
}
